import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.api import create_order
from app.schemas import OrderCreate, CartItem
from app.config import settings

async def test():
    engine = create_async_engine(settings.database_url)
    SessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    order_data = OrderCreate(
        telegram_user_id=123,
        customer_name="Test",
        customer_username="test",
        phone="123",
        shipping_address="123",
        shipping_city="123",
        shipping_state="123",
        shipping_zip="123",
        items=[CartItem(product_id=1, quantity=1)]
    )
    
    async with SessionLocal() as session:
        order = await create_order(order_data, session)
        print("Success:", order.id)

if __name__ == "__main__":
    asyncio.run(test())
