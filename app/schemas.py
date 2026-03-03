from pydantic import BaseModel
from typing import Optional
import datetime

# ── User Profile ──────────────────────────────────────────
class UserProfileBase(BaseModel):
    customer_name: str = ""
    phone: str = ""
    shipping_address: str = ""
    shipping_city: str = ""
    shipping_state: str = ""
    shipping_zip: str = ""

class UserProfileUpdate(UserProfileBase):
    pass

class UserProfileOut(UserProfileBase):
    telegram_id: int

    model_config = {"from_attributes": True}

# ── Categories ──────────────────────────────────────────────
class CategoryBase(BaseModel):
    name: str
    image_url: str = ""
    parent_id: Optional[int] = None
    order: int = 0

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int

    model_config = {"from_attributes": True}


# ── Product Variations ────────────────────────────────────
class ProductVariationBase(BaseModel):
    name: str
    sku: str = ""
    quantity: int = 0
    price_adjustment: float = 0.0

class ProductVariationCreate(ProductVariationBase):
    pass

class ProductVariationUpdate(ProductVariationBase):
    pass

class ProductVariationOut(ProductVariationBase):
    id: int
    product_id: int

    model_config = {"from_attributes": True}

# ── Products ──────────────────────────────────────────────
class ProductOut(BaseModel):
    id: int
    sku: str = ""
    name: str
    description: str
    price: float
    old_price: Optional[float] = None
    image_url: str
    category: str
    subcategory: str
    quantity: int = 0
    in_stock: bool
    is_new: bool = False
    created_at: Optional[datetime.datetime] = None
    variations: list[ProductVariationOut] = []

    model_config = {"from_attributes": True}


# ── Cart ──────────────────────────────────────────────────
class CartItem(BaseModel):
    product_id: int
    quantity: int = 1
    variation_id: Optional[int] = None


# ── Orders ────────────────────────────────────────────────
class OrderCreate(BaseModel):
    telegram_user_id: int
    customer_name: str = ""
    customer_username: str = ""
    phone: str = ""
    shipping_address: str = ""
    shipping_city: str = ""
    shipping_state: str = ""
    shipping_zip: str = ""
    payment_method: str = "zelle"
    payment_confirmation: str = ""
    items: list[CartItem]


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str = ""
    variation_name: str = ""
    quantity: int
    price: float

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: int
    telegram_user_id: int
    customer_name: str = ""
    customer_username: str = ""
    phone: str = ""
    shipping_address: str = ""
    shipping_city: str = ""
    shipping_state: str = ""
    shipping_zip: str = ""
    status: str
    payment_method: str
    payment_confirmation: str
    total: float
    notes: str = ""
    created_at: datetime.datetime
    items: list[OrderItemOut] = []

    model_config = {"from_attributes": True}
