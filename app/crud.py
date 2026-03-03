from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Product, Order, OrderItem, UserProfile, Category
from app.schemas import CartItem, UserProfileUpdate, CategoryCreate, CategoryUpdate


# ── Categories ──────────────────────────────────────────────
async def get_categories(session: AsyncSession) -> list[Category]:
    stmt = select(Category).order_by(Category.order.asc(), Category.id.asc())
    result = await session.execute(stmt)
    return list(result.scalars().all())

async def create_category(session: AsyncSession, data: CategoryCreate) -> Category:
    cat = Category(
        name=data.name,
        image_url=data.image_url,
        parent_id=data.parent_id,
        order=data.order
    )
    session.add(cat)
    await session.commit()
    await session.refresh(cat)
    return cat

async def update_category(session: AsyncSession, category_id: int, data: CategoryUpdate) -> Category | None:
    stmt = select(Category).where(Category.id == category_id)
    result = await session.execute(stmt)
    cat = result.scalar_one_or_none()
    if cat:
        cat.name = data.name
        cat.image_url = data.image_url
        cat.parent_id = data.parent_id
        cat.order = data.order
        await session.commit()
        await session.refresh(cat)
    return cat

async def delete_category(session: AsyncSession, category_id: int) -> bool:
    stmt = select(Category).where(Category.id == category_id)
    result = await session.execute(stmt)
    cat = result.scalar_one_or_none()
    if cat:
        await session.delete(cat)
        await session.commit()
        return True
    return False

# ── Products ────────────────────────────────────────────────
async def get_products(
    session: AsyncSession,
    category: str | None = None,
    subcategory: str | None = None,
    is_new: bool | None = None,
    on_sale: bool | None = None,
) -> list[Product]:
    stmt = select(Product).options(selectinload(Product.variations)).where(Product.in_stock == True)
    if category:
        stmt = stmt.where(Product.category == category)
    if subcategory:
        stmt = stmt.where(Product.subcategory == subcategory)
    if is_new:
        stmt = stmt.where(Product.is_new == True)
    if on_sale:
        stmt = stmt.where(Product.old_price.isnot(None))
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_product(session: AsyncSession, product_id: int) -> Product | None:
    stmt = select(Product).options(selectinload(Product.variations)).where(Product.id == product_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def create_order(
    session: AsyncSession,
    telegram_user_id: int,
    customer_name: str,
    customer_username: str,
    phone: str,
    shipping_address: str,
    shipping_city: str,
    shipping_state: str,
    shipping_zip: str,
    payment_method: str,
    payment_confirmation: str,
    items: list[CartItem],
) -> Order:
    order = Order(
        telegram_user_id=telegram_user_id,
        customer_name=customer_name,
        customer_username=customer_username,
        phone=phone,
        shipping_address=shipping_address,
        shipping_city=shipping_city,
        shipping_state=shipping_state,
        shipping_zip=shipping_zip,
        payment_method=payment_method,
        payment_confirmation=payment_confirmation,
        status="pending",
        total=0.0
    )
    session.add(order)
    await session.flush()

    total = 0.0
    for cart_item in items:
        stmt = select(Product).options(selectinload(Product.variations)).where(Product.id == cart_item.product_id)
        result = await session.execute(stmt)
        product = result.scalar_one_or_none()
        
        if not product:
            continue
            
        unit_price = product.price
        variation_name = ""
        variation = None
        
        if cart_item.variation_id:
            for v in product.variations:
                if v.id == cart_item.variation_id:
                    variation = v
                    unit_price += v.price_adjustment
                    variation_name = v.name
                    break
                    
        item_total_price = unit_price * cart_item.quantity
        total += item_total_price
        
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            variation_name=variation_name,
            quantity=cart_item.quantity,
            price=unit_price,
        )
        session.add(order_item)
        
        # Decrement stock
        if variation:
            if variation.quantity >= cart_item.quantity:
                variation.quantity -= cart_item.quantity
            else:
                variation.quantity = 0

        if product.quantity >= cart_item.quantity:
            product.quantity -= cart_item.quantity
        else:
            product.quantity = 0
            
        if product.quantity == 0:
            product.in_stock = False

    order.total = total    # Save user profile from order data automatically
    profile = await get_user_profile(session, telegram_user_id)
    if not profile:
        profile = UserProfile(telegram_id=telegram_user_id)
        session.add(profile)
    
    profile.customer_name = customer_name
    profile.phone = phone
    profile.shipping_address = shipping_address
    profile.shipping_city = shipping_city
    profile.shipping_state = shipping_state
    profile.shipping_zip = shipping_zip

    await session.commit()
    
    # Reload order with items to avoid MissingGreenlet error when serializing
    stmt = select(Order).options(selectinload(Order.items)).where(Order.id == order.id)
    result = await session.execute(stmt)
    return result.scalar_one()


async def get_orders_by_user(session: AsyncSession, telegram_user_id: int) -> list[Order]:
    stmt = (
        select(Order)
        .where(Order.telegram_user_id == telegram_user_id)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_user_profile(session: AsyncSession, telegram_id: int) -> UserProfile | None:
    stmt = select(UserProfile).where(UserProfile.telegram_id == telegram_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def update_user_profile(session: AsyncSession, telegram_id: int, data: UserProfileUpdate) -> UserProfile:
    profile = await get_user_profile(session, telegram_id)
    if not profile:
        profile = UserProfile(telegram_id=telegram_id)
        session.add(profile)
    
    profile.customer_name = data.customer_name
    profile.phone = data.phone
    profile.shipping_address = data.shipping_address
    profile.shipping_city = data.shipping_city
    profile.shipping_state = data.shipping_state
    profile.shipping_zip = data.shipping_zip

    await session.commit()
    await session.refresh(profile)
    return profile
