import asyncio
from aiogram import Bot
from app.config import settings

async def test():
    bot = Bot(token=settings.bot_token)
    try:
        await bot.send_message(chat_id=settings.admin_group_id, text="Test message")
        print("Success!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(test())
