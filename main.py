"""
Phoenix Lounge Kabwe - High-Throughput Async Backend Engine
Location: 12 Freedom Way, Kabwe, Zambia
Stack: Python 3.11+ / FastAPI / asyncpg PostgreSQL Pooling / Pydantic v2
"""

import os
import uuid
import datetime
from typing import List, Optional, Dict, Any, Literal
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Header, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator, model_validator

# Optional asyncpg driver
try:
    import asyncpg
except ImportError:
    asyncpg = None

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/phoenix_lounge")
DJ_CREDENTIAL_HASH = os.getenv("DJ_SECRET_HASH", "12345678")
STAFF_SECRET_HASH = os.getenv("STAFF_SECRET_HASH", "12345678")
MANAGER_ROOT_HASH = os.getenv("MANAGER_ROOT_HASH", "12345678")

# ------------------------------------------------------------------------------
# In-Memory Fast Fallback Storage (Pool Cache & Standalone Zero-Dependency Node)
# ------------------------------------------------------------------------------
class Store:
    def __init__(self):
        self.orders: Dict[str, dict] = {}
        self.menu_items: Dict[str, dict] = {
            "m1": {"id": "m1", "category": "Whisky & Cognac", "name": "Hennessy VSOP (750ml)", "price": 2400.0, "description": "Original Hennessy Privilege cognac with ice bucket.", "is_visible": True, "in_stock": True},
            "m2": {"id": "m2", "category": "Whisky & Cognac", "name": "Johnnie Walker Black Label (750ml)", "price": 1100.0, "description": "Classic 12-year blended Scotch whisky.", "is_visible": True, "in_stock": True},
            "m3": {"id": "m3", "category": "Whisky & Cognac", "name": "Jameson Irish Whiskey (750ml)", "price": 750.0, "description": "Triple distilled Irish whiskey bottle.", "is_visible": True, "in_stock": True},
            "m4": {"id": "m4", "category": "Vodka & Gin", "name": "Ciroc Snap Frost Vodka (750ml)", "price": 1350.0, "description": "Ultra-premium French grape vodka.", "is_visible": True, "in_stock": True},
            "m5": {"id": "m5", "category": "Vodka & Gin", "name": "Tanqueray No. TEN Gin", "price": 850.0, "description": "Distilled small batch gin with botanical notes.", "is_visible": True, "in_stock": True},
            "m6": {"id": "m6", "category": "Champagne", "name": "Moët & Chandon Nectar Impérial", "price": 2800.0, "description": "Demi-sec sparkling champagne bottle presentation.", "is_visible": True, "in_stock": True},
            "m7": {"id": "m7", "category": "Beers & Ciders", "name": "Mosi Lager Premium (330ml)", "price": 40.0, "description": "Truly Zambian cold lager.", "is_visible": True, "in_stock": True},
            "m8": {"id": "m8", "category": "Beers & Ciders", "name": "Castle Lite Super Cold (330ml)", "price": 45.0, "description": "Sub-zero brewed extra cold lager.", "is_visible": True, "in_stock": True},
            "m9": {"id": "m9", "category": "Beers & Ciders", "name": "Heineken Original (330ml)", "price": 55.0, "description": "Pure malt lager.", "is_visible": True, "in_stock": True},
            "m10": {"id": "m10", "category": "Grills & Platters", "name": "Phoenix Signature Platter", "price": 650.0, "description": "T-bone cutlets, pork ribs, spicy wings, chips & chibwabwa.", "is_visible": True, "in_stock": True},
            "m11": {"id": "m11", "category": "Grills & Platters", "name": "Kabwe Charcoal Braii Wings (12 pcs)", "price": 220.0, "description": "Glazed hot chili wings with herb dip.", "is_visible": True, "in_stock": True},
            "m12": {"id": "m12", "category": "Grills & Platters", "name": "Crispy Golden Fries & Dip", "price": 75.0, "description": "Hand-cut seasoned potato fries with garlic mayo.", "is_visible": True, "in_stock": True},
        }
        self.dj_requests: Dict[str, dict] = {}
        self.dj_shoutouts: Dict[str, dict] = {}
        self.vip_booths: Dict[str, dict] = {
            "V01": {"booth_code": "V01", "name": "Copper King VIP", "tier": "vip", "capacity": 8, "min_spend": 1200.0, "is_reserved": False, "reserved_by": None, "contact_phone": None},
            "V02": {"booth_code": "V02", "name": "Freedom Executive", "tier": "vip", "capacity": 6, "min_spend": 800.0, "is_reserved": False, "reserved_by": None, "contact_phone": None},
            "V03": {"booth_code": "V03", "name": "Presidential Deck", "tier": "vvip_presidential", "capacity": 12, "min_spend": 2500.0, "is_reserved": False, "reserved_by": None, "contact_phone": None},
            "V04": {"booth_code": "V04", "name": "Kabwe Sunset Lounge", "tier": "vip", "capacity": 6, "min_spend": 800.0, "is_reserved": True, "reserved_by": "Private Host", "contact_phone": "0977***"},
            "V05": {"booth_code": "V05", "name": "High Roller Suite", "tier": "vvip_presidential", "capacity": 10, "min_spend": 2000.0, "is_reserved": False, "reserved_by": None, "contact_phone": None},
            "V06": {"booth_code": "V06", "name": "Velvet Gold Corner", "tier": "vip", "capacity": 4, "min_spend": 600.0, "is_reserved": False, "reserved_by": None, "contact_phone": None}
        }
        self.media_timeline: Dict[str, dict] = {}
        self.media_archive: List[dict] = []
        self.active_ticker: str = "NOW SPINNING: KABWE LATE NIGHT AFRO-FUSION & AMAPIANO VIBES | WELCOME TO PHOENIX LOUNGE"
        self.momo_gateways = {
            "airtel": {"merchant_code": "PHOENIX-AIRTEL-449", "short_code": "*115#", "name": "Airtel Money"},
            "mtn": {"merchant_code": "PHOENIX-MTN-882", "short_code": "*115#", "name": "MTN MoMo"},
            "zamtel": {"merchant_code": "PHOENIX-ZAM-104", "short_code": "*115#", "name": "Zamtel Kwacha"}
        }

db = Store()
db_pool = None

# ------------------------------------------------------------------------------
# Lifespan Hook with AsyncPG Connection Pooling
# ------------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    if asyncpg and "postgresql://" in DATABASE_URL:
        try:
            db_pool = await asyncpg.create_pool(
                dsn=DATABASE_URL,
                min_size=10,
                max_size=50,
                max_inactive_connection_lifetime=300.0,
                timeout=10.0
            )
        except Exception:
            db_pool = None
    yield
    if db_pool:
        await db_pool.close()

app = FastAPI(
    title="Phoenix Lounge Kabwe Core API",
    version="1.0.0",
    description="High-Throughput Venue Management & Guest Ordering Hub",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# Pydantic v2 Verification Schemas
# ------------------------------------------------------------------------------
class OrderItemSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    quantity: int = Field(..., gt=0, le=100)
    unit_price: float = Field(..., ge=0)
    total_price: float = Field(..., ge=0)

    @field_validator("total_price")
    @classmethod
    def validate_total(cls, v: float, info) -> float:
        qty = info.data.get("quantity", 1)
        unit = info.data.get("unit_price", 0.0)
        expected = round(qty * unit, 2)
        if abs(v - expected) > 0.05:
            return expected
        return v

class CreateOrderRequest(BaseModel):
    table_booth_number: str = Field(..., min_length=1, max_length=32)
    customer_name: str = Field(..., min_length=2, max_length=100)
    customer_phone: str = Field(..., min_length=8, max_length=20)
    payment_method: Literal["cash", "airtel", "mtn", "zamtel"]
    items: List[OrderItemSchema] = Field(..., min_length=1)
    notes: Optional[str] = Field(None, max_length=255)

    @model_validator(mode="after")
    def compute_and_verify(self):
        if not self.items:
            raise ValueError("Order must contain at least one item.")
        return self

class DJSongRequestSchema(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=100)
    booth_table: str = Field(..., min_length=1, max_length=32)
    song_title: str = Field(..., min_length=2, max_length=150)
    artist: str = Field(..., min_length=2, max_length=150)
    personal_note: Optional[str] = Field("", max_length=255)

class DJBirthdayShoutoutSchema(BaseModel):
    celebrant_name: str = Field(..., min_length=2, max_length=100)
    booth_number: str = Field(..., min_length=1, max_length=32)
    customized_text: str = Field(..., min_length=5, max_length=500)
    song_selection: str = Field(..., min_length=2, max_length=200)

class VIPBoothLockSchema(BaseModel):
    booth_code: str = Field(..., min_length=2, max_length=16)
    customer_name: str = Field(..., min_length=2, max_length=100)
    contact_phone: str = Field(..., min_length=8, max_length=20)
    payment_method: Literal["cash", "airtel", "mtn", "zamtel"]
    notes: Optional[str] = None

class MediaPostSchema(BaseModel):
    uploader_name: str = Field(..., min_length=2, max_length=100)
    table_booth: str = Field(..., min_length=1, max_length=32)
    image_url: str = Field(..., min_length=5)
    caption: Optional[str] = Field("", max_length=200)

class InterstitialSettingsSchema(BaseModel):
    ad_interval_seconds: int = Field(..., ge=5, le=300)
    enabled: bool = True

# ------------------------------------------------------------------------------
# Auth Verification Dependencies
# ------------------------------------------------------------------------------
def verify_dj_token(x_dj_key: Optional[str] = Header(None)) -> bool:
    if not x_dj_key or x_dj_key != DJ_CREDENTIAL_HASH:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid DJ Deck credential hash.")
    return True

def verify_staff_token(x_staff_key: Optional[str] = Header(None)) -> bool:
    if not x_staff_key or (x_staff_key != STAFF_SECRET_HASH and x_staff_key != MANAGER_ROOT_HASH):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized staff access.")
    return True

def verify_manager_root(x_manager_key: Optional[str] = Header(None)) -> bool:
    if not x_manager_key or x_manager_key != MANAGER_ROOT_HASH:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Restricted Root Manager Authentication Required.")
    return True

# ------------------------------------------------------------------------------
# 1. ORDERS ENDPOINTS (High-Volume Routing & Gateway Mapping)
# ------------------------------------------------------------------------------
@app.post("/api/orders", status_code=status.HTTP_201_CREATED)
async def create_order(payload: CreateOrderRequest):
    order_id = f"PLK-{int(datetime.datetime.now().timestamp())}-{uuid.uuid4().hex[:4].upper()}"
    total_amount = sum(item.total_price for item in payload.items)
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    gateway_info = None
    if payload.payment_method in db.momo_gateways:
        gw = db.momo_gateways[payload.payment_method]
        gateway_info = {
            "provider": gw["name"],
            "merchant_code": gw["merchant_code"],
            "dial_code": gw["short_code"],
            "instructions": f"Dial {gw['short_code']} on your phone, choose Pay Merchant, enter {gw['merchant_code']}, and input ZMW {total_amount:.2f}."
        }

    order_record = {
        "id": order_id,
        "table_booth_number": payload.table_booth_number,
        "customer_name": payload.customer_name,
        "customer_phone": payload.customer_phone,
        "payment_method": payload.payment_method,
        "payment_status": "submitted" if payload.payment_method != "cash" else "unpaid",
        "order_status": "pending",
        "total_amount_zmw": round(total_amount, 2),
        "items": [item.model_dump() for item in payload.items],
        "gateway_info": gateway_info,
        "notes": payload.notes,
        "created_at": now_iso,
        "confirmed_at": None
    }
    db.orders[order_id] = order_record
    return {"success": True, "order": order_record}

@app.get("/api/orders")
async def get_orders(status_filter: Optional[str] = None):
    results = list(db.orders.values())
    if status_filter:
        results = [o for o in results if o.get("order_status") == status_filter]
    results.sort(key=lambda x: x["created_at"], reverse=True)
    return {"orders": results, "count": len(results)}

@app.patch("/api/orders/{order_id}/status")
async def update_order_status(order_id: str, new_status: Literal["confirmed", "dropped", "pending"], _: bool = Depends(verify_staff_token)):
    if order_id not in db.orders:
        raise HTTPException(status_code=404, detail="Order reference not located.")
    order = db.orders[order_id]
    order["order_status"] = new_status
    if new_status == "confirmed":
        order["confirmed_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        order["payment_status"] = "verified"
    return {"success": True, "order": order}

# ------------------------------------------------------------------------------
# 2. PRIVATE DJ REQUESTS & SHOUTOUTS
# ------------------------------------------------------------------------------
@app.post("/api/dj/requests", status_code=status.HTTP_201_CREATED)
async def submit_dj_request(payload: DJSongRequestSchema):
    req_id = f"DJR-{uuid.uuid4().hex[:6].upper()}"
    record = {
        "id": req_id,
        "customer_name": payload.customer_name,
        "booth_table": payload.booth_table,
        "song_title": payload.song_title,
        "artist": payload.artist,
        "personal_note": payload.personal_note,
        "is_played": False,
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    db.dj_requests[req_id] = record
    return {"success": True, "request_id": req_id, "message": "Song request forwarded privately to DJ console."}

@app.get("/api/dj/requests")
async def list_dj_requests(_: bool = Depends(verify_dj_token)):
    # Strictly private queue: DJ access only
    items = sorted(db.dj_requests.values(), key=lambda x: x["created_at"], reverse=True)
    return {"requests": items}

@app.delete("/api/dj/requests/{request_id}")
async def dismiss_dj_request(request_id: str, _: bool = Depends(verify_dj_token)):
    if request_id in db.dj_requests:
        del db.dj_requests[request_id]
        return {"success": True, "dismissed": request_id}
    raise HTTPException(status_code=404, detail="Song request not found.")

@app.post("/api/dj/shoutouts", status_code=status.HTTP_201_CREATED)
async def submit_birthday_shoutout(payload: DJBirthdayShoutoutSchema):
    shout_id = f"BDAY-{uuid.uuid4().hex[:6].upper()}"
    record = {
        "id": shout_id,
        "celebrant_name": payload.celebrant_name,
        "booth_number": payload.booth_number,
        "customized_text": payload.customized_text,
        "song_selection": payload.song_selection,
        "is_announced": False,
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    db.dj_shoutouts[shout_id] = record
    return {"success": True, "shoutout_id": shout_id, "message": "Celebration broadcast queued."}

@app.get("/api/dj/shoutouts")
async def list_birthday_shoutouts(_: bool = Depends(verify_dj_token)):
    items = sorted(db.dj_shoutouts.values(), key=lambda x: x["created_at"], reverse=True)
    return {"shoutouts": items}

@app.delete("/api/dj/shoutouts/{shoutout_id}")
async def dismiss_birthday_shoutout(shoutout_id: str, _: bool = Depends(verify_dj_token)):
    if shoutout_id in db.dj_shoutouts:
        del db.dj_shoutouts[shoutout_id]
        return {"success": True, "dismissed": shoutout_id}
    raise HTTPException(status_code=404, detail="Shoutout record not found.")

@app.get("/api/dj/ticker")
async def get_active_ticker():
    return {"ticker": db.active_ticker}

@app.post("/api/dj/ticker")
async def update_active_ticker(ticker_text: str = Query(..., min_length=3, max_length=200), _: bool = Depends(verify_dj_token)):
    db.active_ticker = ticker_text
    return {"success": True, "ticker": db.active_ticker}

# ------------------------------------------------------------------------------
# 3. VIP BOOTH LIVE NODE MATRIX
# ------------------------------------------------------------------------------
@app.get("/api/vip/booths")
async def get_vip_booths():
    booths = list(db.vip_booths.values())
    total_count = len(booths)
    reserved_count = sum(1 for b in booths if b["is_reserved"])
    available_count = total_count - reserved_count
    return {
        "booths": booths,
        "stats": {
            "total": total_count,
            "reserved": reserved_count,
            "available": available_count
        }
    }

@app.patch("/api/vip/booths/{booth_code}/lock")
async def lock_vip_booth(booth_code: str, payload: VIPBoothLockSchema):
    if booth_code not in db.vip_booths:
        raise HTTPException(status_code=404, detail=f"Booth node {booth_code} not recognized.")
    booth = db.vip_booths[booth_code]
    if booth["is_reserved"]:
        raise HTTPException(status_code=409, detail=f"Booth {booth_code} has already been locked [TAKEN].")

    booth["is_reserved"] = True
    booth["reserved_by"] = payload.customer_name
    booth["contact_phone"] = payload.contact_phone
    booth["reserved_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    return {"success": True, "booth": booth}

# ------------------------------------------------------------------------------
# 4. TABLE OF THE NIGHT TIMELINE (Strict 10-Hour TTL Calculation)
# ------------------------------------------------------------------------------
def run_timeline_ttl_purge():
    now = datetime.datetime.now(datetime.timezone.utc)
    expired_ids = []
    for mid, item in db.media_timeline.items():
        exp = datetime.datetime.fromisoformat(item["expires_at"])
        if now >= exp:
            expired_ids.append(mid)
    for mid in expired_ids:
        item = db.media_timeline.pop(mid)
        item["archived_at"] = now.isoformat()
        db.media_archive.append(item)

@app.get("/api/media/timeline")
async def get_timeline_stream():
    run_timeline_ttl_purge()
    items = sorted(db.media_timeline.values(), key=lambda x: x["created_at"], reverse=True)
    return {"posts": items, "count": len(items)}

@app.post("/api/media/timeline", status_code=status.HTTP_201_CREATED)
async def post_to_timeline(payload: MediaPostSchema):
    now = datetime.datetime.now(datetime.timezone.utc)
    ttl_delta = datetime.timedelta(hours=10)
    expires_at = now + ttl_delta

    post_id = f"TL-{uuid.uuid4().hex[:6].upper()}"
    record = {
        "id": post_id,
        "uploader_name": payload.uploader_name,
        "table_booth": payload.table_booth,
        "caption": payload.caption or "",
        "image_url": payload.image_url,
        "reactions": {"fire": 0, "champagne": 0, "crown": 0, "dance": 0},
        "created_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
        "ttl_hours_remaining": 10.0
    }
    db.media_timeline[post_id] = record
    return {"success": True, "post": record}

@app.post("/api/media/timeline/{post_id}/react")
async def react_to_media(post_id: str, emoji_type: Literal["fire", "champagne", "crown", "dance"]):
    if post_id not in db.media_timeline:
        raise HTTPException(status_code=404, detail="Media post expired or not found.")
    post = db.media_timeline[post_id]
    post["reactions"][emoji_type] = post["reactions"].get(emoji_type, 0) + 1
    return {"success": True, "reactions": post["reactions"]}

# ------------------------------------------------------------------------------
# 5. INVENTORY REAL-TIME TOGGLES & MANIFEST
# ------------------------------------------------------------------------------
@app.get("/api/menu")
async def get_menu(include_hidden: bool = False):
    items = list(db.menu_items.values())
    if not include_hidden:
        items = [i for i in items if i["is_visible"]]
    return {"items": items}

@app.patch("/api/menu/{item_id}/toggle")
async def toggle_menu_item(item_id: str, is_visible: bool, _: bool = Depends(verify_staff_token)):
    if item_id not in db.menu_items:
        raise HTTPException(status_code=404, detail="Item not found.")
    db.menu_items[item_id]["is_visible"] = is_visible
    return {"success": True, "item": db.menu_items[item_id]}

# ------------------------------------------------------------------------------
# 6. ROOT MANAGER AUDIT ENDPOINT
# ------------------------------------------------------------------------------
@app.get("/api/manager/audit")
async def get_manager_audit(_: bool = Depends(verify_manager_root)):
    confirmed_orders = [o for o in db.orders.values() if o.get("order_status") == "confirmed"]

    total_gross = sum(o["total_amount_zmw"] for o in confirmed_orders)
    cash_gross = sum(o["total_amount_zmw"] for o in confirmed_orders if o.get("payment_method") == "cash")
    momo_gross = total_gross - cash_gross

    breakdown_by_momo = {
        "airtel": sum(o["total_amount_zmw"] for o in confirmed_orders if o.get("payment_method") == "airtel"),
        "mtn": sum(o["total_amount_zmw"] for o in confirmed_orders if o.get("payment_method") == "mtn"),
        "zamtel": sum(o["total_amount_zmw"] for o in confirmed_orders if o.get("payment_method") == "zamtel")
    }

    pending_count = sum(1 for o in db.orders.values() if o.get("order_status") == "pending")

    return {
        "venue": "Phoenix Lounge Kabwe",
        "audit_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "gross_confirmed_zmw": round(total_gross, 2),
        "cash_gross_zmw": round(cash_gross, 2),
        "momo_gross_zmw": round(momo_gross, 2),
        "momo_breakdown_zmw": breakdown_by_momo,
        "total_confirmed_orders": len(confirmed_orders),
        "pending_fulfillment_orders": pending_count,
        "current_gateways": db.momo_gateways
    }
