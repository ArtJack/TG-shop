from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.schemas import ProductOut, OrderCreate, OrderOut, UserProfileOut, UserProfileUpdate, CategoryOut
from app import crud

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
    session: AsyncSession = Depends(get_session),
):
    products = await crud.get_products(session, category, subcategory, is_new, on_sale)
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
        from app.bot.bot import bot
        from app.config import settings
        
        items_list = "\n".join([f"- Product {item.product_id} x {item.quantity}" for item in data.items])
        
        msg = (
            f"🛒 <b>Новый заказ #{order.id}</b>\n"
            f"👤 Заказчик: {data.customer_name} (@{data.customer_username})\n"
            f"📞 Телефон: {data.phone}\n"
            f"📍 Адрес: {data.shipping_address}, {data.shipping_city}, {data.shipping_state} {data.shipping_zip}\n\n"
            f"💳 Ожидает оплату Zelle\n"
            f"🔑 Confirmation: <code>{data.payment_confirmation}</code>\n\n"
            f"📦 Товары:\n{items_list}"
        )
        
        await bot.send_message(
            chat_id=settings.admin_group_id,
            text=msg,
            parse_mode="HTML"
        )
    except Exception as e:
        import logging
        import traceback
        logging.getLogger(__name__).error(f"Failed to send admin notification: {e}")
        with open("C:/Users/IG/Desktop/Development/TG-shop/error.log", "a", encoding="utf-8") as f:
            f.write(f"Failed to send admin notification: {e}\n{traceback.format_exc()}\n")

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
