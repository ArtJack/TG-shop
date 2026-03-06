import datetime
from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, Text, Float, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    telegram_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    customer_name: Mapped[str] = mapped_column(String(200), default="")
    phone: Mapped[str] = mapped_column(String(50), default="")
    shipping_address: Mapped[str] = mapped_column(String(200), default="")
    shipping_city: Mapped[str] = mapped_column(String(100), default="")
    shipping_state: Mapped[str] = mapped_column(String(50), default="")
    shipping_zip: Mapped[str] = mapped_column(String(20), default="")

class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), default="")
    image_url: Mapped[str] = mapped_column(String(500), default="")
    emoji: Mapped[str] = mapped_column(String(10), default="")
    color: Mapped[str] = mapped_column(String(100), default="")
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"), nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)

    # Relationship for subcategories (parent has many children)
    subcategories: Mapped[list["Category"]] = relationship(
        "Category",
        foreign_keys=[parent_id],
        back_populates="parent_category",
        cascade="all, delete-orphan",
    )
    parent_category: Mapped["Category | None"] = relationship(
        "Category",
        foreign_keys=[parent_id],
        back_populates="subcategories",
        remote_side=[id],
    )


class ProductVariation(Base):
    __tablename__ = "product_variations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., "Size S", "Color Red"
    sku: Mapped[str] = mapped_column(String(50), default="", index=True)
    quantity: Mapped[int] = mapped_column(Integer, default=0)
    price_adjustment: Mapped[float] = mapped_column(Float, default=0.0)

    product: Mapped["Product"] = relationship("Product", back_populates="variations")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sku: Mapped[str] = mapped_column(String(50), default="", index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    price: Mapped[float] = mapped_column(Float, nullable=False)
    old_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    image_url: Mapped[str] = mapped_column(String(500), default="")
    image_urls: Mapped[list[str]] = mapped_column(JSON, default=list, server_default="[]")
    category: Mapped[str] = mapped_column(String(100), default="general")
    subcategory: Mapped[str] = mapped_column(String(100), default="")
    quantity: Mapped[int] = mapped_column(Integer, default=0)
    in_stock: Mapped[bool] = mapped_column(Boolean, default=True)
    is_new: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    
    variations: Mapped[list["ProductVariation"]] = relationship(
        "ProductVariation", back_populates="product", cascade="all, delete-orphan"
    )


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    telegram_user_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)
    customer_name: Mapped[str] = mapped_column(String(200), default="")
    customer_username: Mapped[str] = mapped_column(String(200), default="")
    phone: Mapped[str] = mapped_column(String(50), default="")
    shipping_address: Mapped[str] = mapped_column(String(200), default="")
    shipping_city: Mapped[str] = mapped_column(String(100), default="")
    shipping_state: Mapped[str] = mapped_column(String(50), default="")
    shipping_zip: Mapped[str] = mapped_column(String(20), default="")
    status: Mapped[str] = mapped_column(String(50), default="pending")
    payment_method: Mapped[str] = mapped_column(String(50), default="zelle")
    payment_confirmation: Mapped[str] = mapped_column(String(200), default="")
    total: Mapped[float] = mapped_column(Float, default=0.0)
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    product_name: Mapped[str] = mapped_column(String(200), default="")
    variation_name: Mapped[str] = mapped_column(String(200), default="")
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    price: Mapped[float] = mapped_column(Float, nullable=False)

    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped["Product"] = relationship("Product")
