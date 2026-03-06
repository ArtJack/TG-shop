from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
import datetime
import os
import secrets

from app.config import settings
from app.database import get_session
from app.models import Product, Order, OrderItem, ProductVariation, Category
from app.schemas import ProductOut, OrderOut, ProductVariationOut, ProductVariationCreate, ProductVariationUpdate
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import selectinload
from app.schemas import CategoryCreate, CategoryUpdate, CategoryOut


router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── Auth dependency ──────────────────────────────────────
async def verify_admin(x_admin_secret: str = Header(...)):
    if x_admin_secret != settings.admin_secret:
        raise HTTPException(status_code=403, detail="Invalid admin secret")


# ── Schemas ──────────────────────────────────────────────
class ProductCreate(BaseModel):
    name: str
    sku: str = ""
    description: str = ""
    price: float
    old_price: Optional[float] = None
    image_url: str = ""
    image_urls: list[str] = []
    category: str = "general"
    subcategory: str = ""
    quantity: int = 0
    in_stock: bool = True
    is_new: bool = False


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    old_price: Optional[float] = None
    image_url: Optional[str] = None
    image_urls: Optional[list[str]] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    quantity: Optional[int] = None
    in_stock: Optional[bool] = None
    is_new: Optional[bool] = None


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


# ── DASHBOARD STATS ──────────────────────────────────────


# ── CATEGORIES ───────────────────────────────────────────
@router.get("/categories", response_model=list[CategoryOut])
async def admin_get_categories(
    session: AsyncSession = Depends(get_session),
    _=Depends(verify_admin),
):
    stmt = select(Category).order_by(Category.order.asc(), Category.id.asc())
    result = await session.execute(stmt)
    return list(result.scalars().all())


@router.post("/categories", response_model=CategoryOut)
async def admin_create_category(
    data: CategoryCreate,
    session: AsyncSession = Depends(get_session),
    _=Depends(verify_admin),
):
    cat = Category(
        name=data.name,
        slug=data.slug,
        image_url=data.image_url,
        emoji=data.emoji,
        color=data.color,
        parent_id=data.parent_id,
        order=data.order
    )
    session.add(cat)
    await session.commit()
    await session.refresh(cat)
    return cat


@router.put("/categories/{category_id}", response_model=CategoryOut)
async def admin_update_category(
    category_id: int,
    data: CategoryUpdate,
    session: AsyncSession = Depends(get_session),
    _=Depends(verify_admin),
):
    stmt = select(Category).where(Category.id == category_id)
    result = await session.execute(stmt)
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
        
    cat.name = data.name
    cat.slug = data.slug
    cat.image_url = data.image_url
    cat.emoji = data.emoji
    cat.color = data.color
    cat.parent_id = data.parent_id
    cat.order = data.order
    await session.commit()
    await session.refresh(cat)
    return cat


@router.delete("/categories/{category_id}")
async def admin_delete_category(
    category_id: int,
    session: AsyncSession = Depends(get_session),
    _=Depends(verify_admin),
):
    stmt = select(Category).where(Category.id == category_id)
    result = await session.execute(stmt)
    cat = result.scalar_one_or_none()
    if cat:
        await session.delete(cat)
        await session.commit()
    return {"ok": True}
@router.get("/stats", dependencies=[Depends(verify_admin)])
async def get_dashboard_stats(session: AsyncSession = Depends(get_session)):
    # Total products and out of stock
    total_products = await session.scalar(select(func.count(Product.id)))
    out_of_stock = await session.scalar(select(func.count(Product.id)).where(Product.in_stock == False))

    # Revenue and orders
    total_orders = await session.scalar(select(func.count(Order.id)))
    total_revenue = await session.scalar(select(func.sum(Order.total))) or 0.0

    today = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_orders = await session.scalar(select(func.count(Order.id)).where(Order.created_at >= today))
    today_revenue = await session.scalar(select(func.sum(Order.total)).where(Order.created_at >= today)) or 0.0

    # Orders by status
    status_counts_result = await session.execute(
        select(Order.status, func.count(Order.id)).group_by(Order.status)
    )
    status_counts = dict(status_counts_result.all())

    return {
        "products": {
            "total": total_products,
            "out_of_stock": out_of_stock
        },
        "orders": {
            "total": total_orders,
            "today": today_orders,
            "total_revenue": total_revenue,
            "today_revenue": today_revenue,
            "by_status": status_counts
        }
    }


# ── PRODUCTS ─────────────────────────────────────────────
@router.get("/products", response_model=list[ProductOut], dependencies=[Depends(verify_admin)])
async def list_all_products(session: AsyncSession = Depends(get_session)):
    """List ALL products."""
    result = await session.execute(
        select(Product).options(selectinload(Product.variations)).order_by(Product.id.desc())
    )
    return list(result.scalars().all())


@router.post("/products", response_model=ProductOut, dependencies=[Depends(verify_admin)])
async def create_product(
    data: ProductCreate,
    session: AsyncSession = Depends(get_session),
):
    product_dict = data.model_dump()

    product = Product(**product_dict)
    session.add(product)
    await session.commit()
    
    stmt = select(Product).options(selectinload(Product.variations)).where(Product.id == product.id)
    result = await session.execute(stmt)
    return result.scalar_one()


@router.put("/products/{product_id}", response_model=ProductOut, dependencies=[Depends(verify_admin)])
async def update_product(
    product_id: int,
    data: ProductUpdate,
    session: AsyncSession = Depends(get_session),
):
    stmt = select(Product).options(selectinload(Product.variations)).where(Product.id == product_id)
    result = await session.execute(stmt)
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)

    await session.commit()
    return product


@router.delete("/products/{product_id}", dependencies=[Depends(verify_admin)])
async def delete_product(
    product_id: int,
    session: AsyncSession = Depends(get_session),
):
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    await session.delete(product)
    await session.commit()
    return {"ok": True, "deleted": product_id}


# ── PRODUCT VARIATIONS ────────────────────────────────────
@router.post("/products/{product_id}/variations", response_model=ProductVariationOut, dependencies=[Depends(verify_admin)])
async def create_product_variation(
    product_id: int,
    data: ProductVariationCreate,
    session: AsyncSession = Depends(get_session)
):
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    variation = ProductVariation(**data.model_dump(), product_id=product_id)
    session.add(variation)
    await session.commit()
    await session.refresh(variation)
    return variation

@router.put("/variations/{variation_id}", response_model=ProductVariationOut, dependencies=[Depends(verify_admin)])
async def update_product_variation(
    variation_id: int,
    data: ProductVariationUpdate,
    session: AsyncSession = Depends(get_session)
):
    variation = await session.get(ProductVariation, variation_id)
    if not variation:
        raise HTTPException(status_code=404, detail="Variation not found")
        
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(variation, key, value)
        
    await session.commit()
    await session.refresh(variation)
    return variation

@router.delete("/variations/{variation_id}", dependencies=[Depends(verify_admin)])
async def delete_product_variation(
    variation_id: int,
    session: AsyncSession = Depends(get_session)
):
    variation = await session.get(ProductVariation, variation_id)
    if not variation:
        raise HTTPException(status_code=404, detail="Variation not found")
        
    await session.delete(variation)
    await session.commit()
    return {"ok": True}


# ── UPLOAD ───────────────────────────────────────────────
@router.post("/upload", dependencies=[Depends(verify_admin)])
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    os.makedirs("uploads", exist_ok=True)
    # create secure random filename
    extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{secrets.token_urlsafe(16)}.{extension}"
    file_path = os.path.join("uploads", filename)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Return relative path so it works across both localhost and ngrok domains
    return {"url": f"/uploads/{filename}"}


# ── ORDERS ───────────────────────────────────────────────
@router.get("/orders", response_model=list[OrderOut], dependencies=[Depends(verify_admin)])
async def list_orders(session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(Order)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/orders/{order_id}", response_model=OrderOut, dependencies=[Depends(verify_admin)])
async def get_order_detail(order_id: int, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.put("/orders/{order_id}", response_model=OrderOut, dependencies=[Depends(verify_admin)])
async def update_order(
    order_id: int,
    data: OrderUpdate,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Order).options(selectinload(Order.items)).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if data.status is not None:
        order.status = data.status
    if data.notes is not None:
        order.notes = data.notes

    await session.commit()
    await session.refresh(order)
    return order
