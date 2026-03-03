import logging
import random
import datetime

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import async_session
from app.models import Product, Order, OrderItem

logger = logging.getLogger(__name__)

DEMO_PRODUCTS = [
    # ── New Arrivals ─────────────────────────────────────
    {
        "sku": "JWL-RNG-001",
        "name": "Desert Rose Ring",
        "description": "Elegant rose-gold ring inspired by desert flowers. Hand-crafted with intricate petal detailing and a matte finish. Perfect for everyday elegance.",
        "price": 89.0,
        "image_url": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80",
        "category": "jewelry",
        "subcategory": "rings",
        "is_new": True,
        "quantity": 25,
        "in_stock": True,
    },
    {
        "sku": "CLT-WOM-001",
        "name": "Silk Wrap Dress",
        "description": "Flowing silk wrap dress in warm terracotta. Lightweight and breathable fabric, perfect for warm evenings. Features an adjustable waist tie.",
        "price": 195.0,
        "image_url": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80",
        "category": "clothes",
        "subcategory": "women",
        "is_new": True,
        "quantity": 12,
        "in_stock": True,
    },
    {
        "sku": "PRF-001",
        "name": "Amber Eau de Parfum",
        "description": "Warm amber fragrance with notes of sandalwood, vanilla, and desert spices. Long-lasting scent that captures golden hour magic. 50ml bottle.",
        "price": 120.0,
        "image_url": "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=80",
        "category": "perfume",
        "subcategory": "",
        "is_new": True,
        "quantity": 40,
        "in_stock": True,
    },
    # ── Sale 50% Off ─────────────────────────────────────
    {
        "sku": "JWL-EAR-001",
        "name": "Crystal Drop Earrings",
        "description": "Stunning crystal drop earrings with gold-plated hooks. Light-catching faceted stones add sparkle to any outfit. Hypoallergenic materials.",
        "price": 35.0,
        "old_price": 70.0,
        "image_url": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80",
        "category": "jewelry",
        "subcategory": "earrings",
        "quantity": 8,
        "in_stock": True,
    },
    {
        "sku": "TOT-001",
        "name": "Leather Tote Bag",
        "description": "Handcrafted genuine leather tote in camel brown. Spacious interior with multiple pockets. Gold-tone hardware and reinforced handles.",
        "price": 125.0,
        "old_price": 250.0,
        "image_url": "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&q=80",
        "category": "totes",
        "subcategory": "",
        "quantity": 3,
        "in_stock": True,
    },
    {
        "sku": "CLT-MEN-001",
        "name": "Linen Blazer",
        "description": "Relaxed-fit linen blazer in sand color. Two-button closure, patch pockets, and breathable weave. Perfect for smart-casual occasions.",
        "price": 89.0,
        "old_price": 178.0,
        "image_url": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80",
        "category": "clothes",
        "subcategory": "men",
        "quantity": 0,
        "in_stock": False,
    },
    # ── Jewelry ──────────────────────────────────────────
    {
        "sku": "JWL-NEC-001",
        "name": "Gold Chain Necklace",
        "description": "Delicate 18k gold-plated chain necklace. Minimalist design that layers beautifully. Adjustable length 40-45cm. Tarnish-resistant coating.",
        "price": 65.0,
        "image_url": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80",
        "category": "jewelry",
        "subcategory": "earrings",
        "quantity": 15,
        "in_stock": True,
    },
    {
        "sku": "JWL-BRO-001",
        "name": "Pearl Brooch",
        "description": "Vintage-inspired pearl brooch with gold filigree frame. Features genuine freshwater pearls. A timeless accessory for coats and scarves.",
        "price": 55.0,
        "image_url": "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&q=80",
        "category": "jewelry",
        "subcategory": "brooches",
        "quantity": 5,
        "in_stock": True,
    },
    {
        "sku": "JWL-RNG-002",
        "name": "Turquoise Ring",
        "description": "Statement ring with natural turquoise stone set in sterling silver. Each stone is unique with its own distinctive pattern. Adjustable band.",
        "price": 78.0,
        "image_url": "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=600&q=80",
        "category": "jewelry",
        "subcategory": "rings",
        "quantity": 18,
        "in_stock": True,
    },
    # ── Clothes ──────────────────────────────────────────
    {
        "sku": "CLT-WOM-002",
        "name": "Cotton Maxi Skirt",
        "description": "Flowy cotton maxi skirt in sunset orange. Elastic waistband for comfort, tiered ruffled hem. Machine washable and wrinkle-resistant.",
        "price": 85.0,
        "image_url": "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&q=80",
        "category": "clothes",
        "subcategory": "women",
        "quantity": 14,
        "in_stock": True,
    },
    {
        "sku": "CLT-MEN-002",
        "name": "Denim Jacket",
        "description": "Classic denim jacket in faded indigo wash. Relaxed fit with stretch denim for comfort. Button-front closure and chest pockets.",
        "price": 110.0,
        "image_url": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80",
        "category": "clothes",
        "subcategory": "men",
        "quantity": 22,
        "in_stock": True,
    },
    # ── Totes ────────────────────────────────────────────
    {
        "sku": "TOT-002",
        "name": "Canvas Beach Tote",
        "description": "Oversized canvas tote with rope handles. Sand-resistant interior lining. Features an inside zip pocket and magnetic closure.",
        "price": 65.0,
        "image_url": "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=600&q=80",
        "category": "totes",
        "subcategory": "",
        "quantity": 30,
        "in_stock": True,
    },
    # ── Shoes ────────────────────────────────────────────
    {
        "sku": "SHO-001",
        "name": "Suede Ankle Boots",
        "description": "Soft suede ankle boots in warm taupe. Low stacked heel for all-day comfort. Side zip closure and cushioned insole.",
        "price": 165.0,
        "image_url": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80",
        "category": "shoes",
        "subcategory": "",
        "quantity": 5,
        "in_stock": True,
    },
    {
        "sku": "SHO-002",
        "name": "Espadrille Sandals",
        "description": "Woven espadrille sandals with leather straps. Natural jute platform sole. Comfortable memory foam footbed. Vacation-ready style.",
        "price": 75.0,
        "image_url": "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600&q=80",
        "category": "shoes",
        "subcategory": "",
        "quantity": 10,
        "in_stock": True,
    },
    # ── Perfume ──────────────────────────────────────────
    {
        "sku": "PRF-002",
        "name": "Oud Noir Cologne",
        "description": "Bold oud-based cologne with smoky wood undertones. Sophisticated evening scent with exceptional longevity. 75ml glass bottle.",
        "price": 145.0,
        "image_url": "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80",
        "category": "perfume",
        "subcategory": "",
        "quantity": 0,
        "in_stock": False,
    },
    # ── Home ─────────────────────────────────────────────
    {
        "sku": "HOM-001",
        "name": "Moroccan Candle Set",
        "description": "Set of 3 hand-poured soy candles in ornate Moroccan-style holders. Scents: fig, cedar, and jasmine. 40-hour burn time each.",
        "price": 55.0,
        "image_url": "https://images.unsplash.com/photo-1602523961358-f9f03dd557db?w=600&q=80",
        "category": "home",
        "subcategory": "",
        "quantity": 45,
        "in_stock": True,
    },
    {
        "sku": "HOM-002",
        "name": "Woven Throw Blanket",
        "description": "Handwoven cotton throw blanket with geometric desert pattern. Warm caramel and cream tones. Generous 150x200cm size.",
        "price": 95.0,
        "image_url": "https://images.unsplash.com/photo-1580301762395-21ce6d555b43?w=600&q=80",
        "category": "home",
        "subcategory": "",
        "quantity": 17,
        "in_stock": True,
    },
]


MOCK_ORDERS = [
    {
        "telegram_user_id": 10001,
        "customer_name": "Anna Smith",
        "customer_username": "annas",
        "status": "pending",
        "items": [{"idx": 0, "qty": 1}, {"idx": 3, "qty": 2}],
        "days_ago": 0,
    },
    {
        "telegram_user_id": 10002,
        "customer_name": "John Doe",
        "customer_username": "johnd",
        "status": "confirmed",
        "items": [{"idx": 1, "qty": 1}],
        "days_ago": 1,
    },
    {
        "telegram_user_id": 10003,
        "customer_name": "Elena V.",
        "customer_username": "elenav",
        "status": "shipped",
        "items": [{"idx": 2, "qty": 1}, {"idx": 15, "qty": 3}],
        "days_ago": 3,
    },
    {
        "telegram_user_id": 10004,
        "customer_name": "Mark Wilson",
        "customer_username": "markw",
        "status": "delivered",
        "items": [{"idx": 5, "qty": 1}],
        "days_ago": 5,
    },
]


async def seed_products():
    """Insert demo products and mock orders CRM data."""
    async with async_session() as session:
        result = await session.execute(select(Product).limit(1))
        if result.scalar():
            logger.info("Products already seeded — skipping.")
            return

        # Seed products
        products = []
        for data in DEMO_PRODUCTS:
            prod = Product(**data)
            session.add(prod)
            products.append(prod)
        
        await session.flush()
        
        # Seed mock orders for CRM
        for o_data in MOCK_ORDERS:
            total = 0
            order = Order(
                telegram_user_id=o_data["telegram_user_id"],
                customer_name=o_data["customer_name"],
                customer_username=o_data["customer_username"],
                status=o_data["status"],
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=o_data["days_ago"])
            )
            session.add(order)
            await session.flush()
            
            for item in o_data["items"]:
                p = products[item["idx"]]
                oi = OrderItem(
                    order_id=order.id,
                    product_id=p.id,
                    product_name=p.name,
                    quantity=item["qty"],
                    price=p.price
                )
                total += p.price * item["qty"]
                session.add(oi)
            
            order.total = total

        await session.commit()
        logger.info("Seeded %d demo products and %d mock orders.", len(DEMO_PRODUCTS), len(MOCK_ORDERS))
