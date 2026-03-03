import sqlite3
import os

db_path = "shop.db"
if not os.path.exists(db_path):
    print("shop.db not found!")
    exit(1)

conn = sqlite3.connect(db_path)
c = conn.cursor()

try:
    c.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        image_url VARCHAR(500) DEFAULT '',
        parent_id INTEGER,
        "order" INTEGER DEFAULT 0,
        FOREIGN KEY(parent_id) REFERENCES categories(id)
    )
    """)
    print("Created categories table")
except sqlite3.OperationalError as e:
    print(f"Failed to create categories table: {e}")

conn.commit()
conn.close()
print("Migration done")
