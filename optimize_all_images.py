import os
import shutil
from PIL import Image

# 1. Update cover.jpg from user uploaded media_1791292816498.jpg
user_cover = r"C:/Users/thebo/.gemini/antigravity/brain/ce9524b2-4013-4536-948e-0f7a8d73b233/.user_uploaded/media_1791292816498.jpg"
target_cover = r"frontend/public/cover.jpg"

print(f"Loading user cover from: {user_cover}")
im_cover = Image.open(user_cover).convert("RGB")
# Save optimized cover (maintain 571x1024 or scale to 480x860)
# 571x1024 with quality=82 is ~120KB, very sharp
im_cover.save(target_cover, "JPEG", quality=82, optimize=True, progressive=True)
print(f"Saved optimized cover.jpg: {os.path.getsize(target_cover)/1024:.1f} KB")

# 2. Optimize all stage and ending images in frontend/public
public_dir = r"frontend/public"
optimized_count = 0
saved_bytes = 0

for filename in os.listdir(public_dir):
    if filename == "cover.jpg":
        continue
    filepath = os.path.join(public_dir, filename)
    if not os.path.isfile(filepath):
        continue
    
    ext = os.path.splitext(filename)[1].lower()
    if ext in [".jpg", ".jpeg"]:
        orig_sz = os.path.getsize(filepath)
        with Image.open(filepath) as img:
            img = img.convert("RGB")
            w, h = img.size
            # If large (e.g. 1024x1024), resize to 512x512
            target_size = (512, 512) if (w > 512 or h > 512) else (w, h)
            img_resized = img.resize(target_size, Image.Resampling.LANCZOS)
            img_resized.save(filepath, "JPEG", quality=78, optimize=True, progressive=True)
            
        new_sz = os.path.getsize(filepath)
        saved = orig_sz - new_sz
        saved_bytes += saved
        optimized_count += 1
        print(f"Optimized {filename:22}: {orig_sz/1024:6.1f} KB -> {new_sz/1024:5.1f} KB ({saved/orig_sz*100:4.1f}% saved)")

# 3. Optimize role assets in frontend/src/assets
assets_dir = r"frontend/src/assets"
for filename in ["role_pensioner.png", "role_salary.png", "role_wealthy.png"]:
    filepath = os.path.join(assets_dir, filename)
    if os.path.exists(filepath):
        orig_sz = os.path.getsize(filepath)
        with Image.open(filepath) as img:
            img.save(filepath, "PNG", optimize=True)
        new_sz = os.path.getsize(filepath)
        print(f"Optimized {filename:22}: {orig_sz/1024:6.1f} KB -> {new_sz/1024:5.1f} KB")

print(f"\nFinished! Optimized {optimized_count} images. Total space saved: {saved_bytes/1024/1024:.2f} MB")
