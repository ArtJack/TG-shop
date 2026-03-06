import os
import shutil
import sqlite3

artifacts_dir = "/Users/eugenemenshikov/.gemini/antigravity/brain/4a5367e7-b13f-4b65-af92-43d62bfb0427"
uploads_dir = "/Users/eugenemenshikov/Desktop/AI/TG-shop/uploads"

os.makedirs(uploads_dir, exist_ok=True)

# Find generated images
images = {}
for file in os.listdir(artifacts_dir):
    if file.startswith("cat_") and file.endswith(".png"):
        category_key = file.split("_")[1] # e.g. cat_jewelry_123.png -> jewelry
        images[category_key] = file

print(f"Found images: {images}")

categories_map = {
    "jewelry": "jewelry",
    "shoes": "shoes",
    "clothes": "clothes",
    "perfume": "perfume",
    "cosmetics": "cosmetics",
    "totes": "totes",
    "available": "available now"
}

db_path = "/Users/eugenemenshikov/Desktop/AI/TG-shop/shop.db"
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Update DB items
for key, filename in images.items():
    source_path = os.path.join(artifacts_dir, filename)
    dest_path = os.path.join(uploads_dir, filename)
    shutil.copy(source_path, dest_path)
    print(f"Copied {filename} to uploads/")
    
    # We use these paths for UI components if needed, or DB
    url = f"/uploads/{filename}"
    
    if key in categories_map:
        db_cat_name = categories_map[key]
        c.execute("UPDATE categories SET image_url = ? WHERE name LIKE ?", (url, f"%{db_cat_name}%"))
        print(f"Updated DB for {db_cat_name} -> {url}")

conn.commit()
conn.close()
print("Done!")
