from aiogram.types import (
    ReplyKeyboardMarkup,
    KeyboardButton,
    WebAppInfo,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
)


def get_main_keyboard(webapp_url: str) -> ReplyKeyboardMarkup:
    """Main keyboard. Uses WebApp button only if URL is HTTPS (Telegram requirement)."""
    buttons = []

    if webapp_url.startswith("https://"):
        buttons.append([
            KeyboardButton(
                text="🛍 Открыть магазин",
                web_app=WebAppInfo(url=webapp_url),
            )
        ])
    else:
        buttons.append([KeyboardButton(text="🛍 Открыть магазин")])

    buttons.append(
        [KeyboardButton(text="📦 Мои заказы"), KeyboardButton(text="❓ Помощь")]
    )

    return ReplyKeyboardMarkup(keyboard=buttons, resize_keyboard=True)


def get_order_inline(order_id: int) -> InlineKeyboardMarkup:
    """Inline button for order details (placeholder)."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=f"📋 Заказ #{order_id}",
                    callback_data=f"order:{order_id}",
                )
            ]
        ]
    )
