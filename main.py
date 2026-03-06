import asyncio
import logging
import os
import sys

import uvicorn
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import BotCommand
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db
from app.api import router as api_router
from app.admin_api import router as admin_router
from app.bot.bot import bot
from app.bot.handlers import router as bot_router
from seed import seed_products

logger = logging.getLogger(__name__)

# ── Dispatcher ──────────────────────────────────────────
dp = Dispatcher()
dp.include_router(bot_router)

_polling_task = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _polling_task

    logger.info("Initializing database…")
    await init_db()
    await seed_products()

    # Set bot commands
    await bot.set_my_commands([
        BotCommand(command="start", description="Main menu"),
        BotCommand(command="shop", description="Open the store"),
        BotCommand(command="help", description="Help & info"),
    ])

    if settings.debug:
        # Long polling for local development
        logger.info("Starting bot in POLLING mode (debug)…")
        _polling_task = asyncio.create_task(
            dp.start_polling(bot, handle_signals=False)
        )
    else:
        # Webhook for production (need public HTTPS URL)
        webhook_url = settings.webapp_url.rstrip("/") + "/webhook"
        await bot.set_webhook(
            url=webhook_url,
            allowed_updates=dp.resolve_used_update_types(),
            drop_pending_updates=True,
        )
        logger.info("Webhook set: %s", webhook_url)

    yield

    # Shutdown
    if settings.debug and _polling_task:
        await dp.stop_polling()
        _polling_task.cancel()
    else:
        await bot.delete_webhook()
    await bot.session.close()
    logger.info("Bot stopped")


# ── FastAPI ───────────────────────────────────────────────
app = FastAPI(title="Private Drop API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(admin_router)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.post("/webhook")
async def webhook_endpoint(request_data: dict):
    """Receive Telegram webhook updates (production mode)."""
    from aiogram.types import Update
    update = Update.model_validate(request_data, context={"bot": bot})
    await dp.feed_update(bot, update)
    return {"ok": True}


# ── Health check ──────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok"}


# ── Entry point ───────────────────────────────────────────
if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
        stream=sys.stdout,
    )
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=settings.port,
    )
