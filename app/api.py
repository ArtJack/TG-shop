import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.bot.bot import bot
from app.config import settings
from app.database import get_session
from app.schemas import ProductOut, OrderCreate, OrderOut, UserProfileOut, UserProfileUpdate, CategoryOut
from app import crud

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["shop"])

# ── Categories ──────────────────────────────────────────────
@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(session: AsyncSession = Depends(get_session)):
    return await crud.get_categories(session)

# ── Products ────────────────────────────────────────────────
@router.get("/products", response_model=list[ProductOut])
async def list_products(
    category: str | None = None,
    subcategory: str | None = None,
    is_new: bool | None = None,
    on_sale: bool | None = None,
    in_stock: bool | None = None,
    session: AsyncSession = Depends(get_session),
):
    products = await crud.get_products(session, category, subcategory, is_new, on_sale, in_stock)
    return products


@router.get("/products/{product_id}", response_model=ProductOut)
async def get_product(
    product_id: int,
    session: AsyncSession = Depends(get_session),
):
    product = await crud.get_product(session, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/orders", response_model=OrderOut)
async def create_order(
    data: OrderCreate,
    session: AsyncSession = Depends(get_session),
):
    if not data.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    order = await crud.create_order(
        session,
        data.telegram_user_id,
        data.customer_name,
        data.customer_username,
        data.phone,
        data.shipping_address,
        data.shipping_city,
        data.shipping_state,
        data.shipping_zip,
        data.payment_method,
        data.payment_confirmation,
        data.items
    )
    
    # Send notification to admin group
    try:
        items_text = ""
        for item in order.items:
            var_text = f" ({item.variation_name})" if item.variation_name else ""
            items_text += f"• {item.quantity}x {item.product_name}{var_text} - ${item.price * item.quantity:.2f}\n"

        msg = (
            f"🛒 <b>New Order #{order.id}</b>\n\n"
            f"👤 <b>Customer:</b> {order.customer_name} (@{order.customer_username})\n"
            f"📞 <b>Phone:</b> {order.phone}\n"
            f"📍 <b>Address:</b> {order.shipping_address}, {order.shipping_city}, {order.shipping_state} {order.shipping_zip}\n\n"
            f"📦 <b>Items:</b>\n{items_text}\n"
            f"💰 <b>Total:</b> ${order.total:.2f}\n\n"
            f"💳 <b>Payment:</b> {order.payment_method.capitalize()} (Pending)\n"
            f"🔑 <b>Confirmation:</b> <code>{order.payment_confirmation}</code>"
        )

        await bot.send_message(
            chat_id=settings.admin_group_id,
            text=msg,
            parse_mode="HTML"
        )
    except Exception:
        logger.exception("Failed to send admin notification for order #%s", order.id)

    return order


@router.get("/orders/{telegram_user_id}", response_model=list[OrderOut])
async def get_orders(
    telegram_user_id: int,
    session: AsyncSession = Depends(get_session),
):
    orders = await crud.get_orders_by_user(session, telegram_user_id)
    return orders


@router.get("/users/{telegram_id}/profile", response_model=UserProfileOut)
async def get_user_profile(
    telegram_id: int,
    session: AsyncSession = Depends(get_session),
):
    profile = await crud.get_user_profile(session, telegram_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/users/{telegram_id}/profile", response_model=UserProfileOut)
async def update_user_profile(
    telegram_id: int,
    data: UserProfileUpdate,
    session: AsyncSession = Depends(get_session),
):
    profile = await crud.update_user_profile(session, telegram_id, data)
    return profile
