import logging

from aiogram import Router, F
from aiogram.filters import CommandStart, Command
from aiogram.types import Message, PreCheckoutQuery, ContentType

from app.bot.keyboards import get_main_keyboard
from app.config import settings
from app.database import async_session
from app.crud import get_orders_by_user, create_order
from app.schemas import CartItem

logger = logging.getLogger(__name__)

router = Router()


# ── /start ────────────────────────────────────────────────
@router.message(CommandStart())
async def cmd_start(message: Message):
    is_https = settings.webapp_url.startswith("https://")
    text = (
        "👋 Добро пожаловать в <b>TG Shop</b>!\n\n"
    )
    if is_https:
        text += "Нажми кнопку ниже, чтобы открыть магазин 🛍"
    else:
        text += (
            "🛍 Нажми «Открыть магазин» для ссылки на каталог.\n\n"
            "⚠️ <i>Mini App станет доступна после настройки HTTPS (ngrok).</i>"
        )
    await message.answer(
        text,
        reply_markup=get_main_keyboard(settings.webapp_url),
    )


# ── «🛍 Открыть магазин» text button (no HTTPS fallback) ─
@router.message(F.text == "🛍 Открыть магазин")
async def open_shop_fallback(message: Message):
    """When WebApp URL is HTTP, send a clickable link instead."""
    await message.answer(
        f"🛍 <b>Открой магазин в браузере:</b>\n\n"
        f"{settings.webapp_url}\n\n"
        f"⚠️ Для работы Mini App внутри Telegram нужен HTTPS.\n"
        f"Настрой ngrok: <code>ngrok http 5173</code>",
    )


# ── /help ─────────────────────────────────────────────────
@router.message(Command("help"))
async def cmd_help(message: Message):
    await message.answer(
        "🤖 <b>TG Shop — Telegram-магазин</b>\n\n"
        "• Нажми «🛍 Открыть магазин», чтобы просмотреть каталог\n"
        "• Добавь товары в корзину и оформи заказ\n"
        "• Нажми «📦 Мои заказы», чтобы посмотреть историю\n\n"
        "Команды:\n"
        "/start — главное меню\n"
        "/help — эта справка\n"
        "/shop — открыть магазин",
    )


# ── /shop ─────────────────────────────────────────────────
@router.message(Command("shop"))
async def cmd_shop(message: Message):
    await message.answer(
        "🛍 Нажми кнопку, чтобы открыть магазин:",
        reply_markup=get_main_keyboard(settings.webapp_url),
    )


# ── «📦 Мои заказы» text button ─────────────────────────
@router.message(F.text == "📦 Мои заказы")
async def my_orders(message: Message):
    async with async_session() as session:
        orders = await get_orders_by_user(session, message.from_user.id)

    if not orders:
        await message.answer("У тебя пока нет заказов 📭")
        return

    lines = ["📦 <b>Твои заказы:</b>\n"]
    for order in orders[:10]:
        lines.append(
            f"• <b>#{order.id}</b> — {order.total:.2f} ₽ — <i>{order.status}</i>"
        )
    await message.answer("\n".join(lines))


# ── «❓ Помощь» text button ──────────────────────────────
@router.message(F.text == "❓ Помощь")
async def help_button(message: Message):
    await cmd_help(message)


# ── Telegram Payments: pre-checkout ──────────────────────
@router.pre_checkout_query()
async def process_pre_checkout(pre_checkout_query: PreCheckoutQuery):
    """Always accept pre-checkout (stub — no real provider yet)."""
    await pre_checkout_query.answer(ok=True)


# ── Telegram Payments: successful payment ────────────────
@router.message(F.content_type == ContentType.SUCCESSFUL_PAYMENT)
async def process_successful_payment(message: Message):
    """Handle successful Telegram payment — create order in DB."""
    payment = message.successful_payment
    logger.info(
        "Payment received: user=%s amount=%s %s",
        message.from_user.id,
        payment.total_amount,
        payment.currency,
    )

    # The invoice_payload should contain JSON cart data, but for now just log it
    await message.answer(
        "✅ Оплата прошла успешно!\n"
        f"Сумма: {payment.total_amount / 100:.2f} {payment.currency}\n\n"
        "Спасибо за покупку! 🎉"
    )
