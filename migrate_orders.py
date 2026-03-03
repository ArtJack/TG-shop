import sqlite3
import os

db_path = "shop.db"
if not os.path.exists(db_path):
    print("shop.db not found!")
    exit(1)

conn = sqlite3.connect(db_path)
c = conn.cursor()

try:
    c.execute("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'zelle'")
    print("Added payment_method column")
except sqlite3.OperationalError as e:
    print(f"Skipped payment_method: {e}")

try:
    c.execute("ALTER TABLE orders ADD COLUMN payment_confirmation VARCHAR(200) DEFAULT ''")
    print("Added payment_confirmation column")
except sqlite3.OperationalError as e:
    print(f"Skipped payment_confirmation: {e}")

try:
    c.execute("UPDATE orders SET payment_method = 'zelle' WHERE payment_method IS NULL")
    print("Updated existing orders")
except Exception as e:
    pass

conn.commit()
conn.close()
print("Migration done")
