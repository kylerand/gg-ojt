#!/usr/bin/env python3
"""Generate branded placeholder images for training modules."""

from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent / "client" / "public" / "images" / "modules"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Brand colors (from Golfin' Garage)
NAVY_BLUE = (26, 54, 93)
GOLD = (201, 162, 39)
WHITE = (255, 255, 255)

# Module configurations
MODULES = [
    ("01-orientation", "Orientation\n& Safety", "🛡️"),
    ("02-frame-chassis", "Frame &\nChassis", "🔧"),
    ("03-electrical", "Electrical\nSystem", "⚡"),
    ("04-drivetrain", "Drivetrain\n& Motor", "⚙️"),
    ("05-steering-suspension", "Steering &\nSuspension", "🎯"),
    ("06-body-accessories", "Body &\nAccessories", "🚗"),
    ("07-quality-inspection", "Quality\nInspection", "✅"),
]

def create_gradient(width, height, color1, color2):
    """Create a diagonal gradient image."""
    img = Image.new('RGB', (width, height))
    for y in range(height):
        for x in range(width):
            # Diagonal gradient
            ratio = (x + y) / (width + height)
            r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
            g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
            b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
            img.putpixel((x, y), (r, g, b))
    return img

def create_module_image(module_id, title, icon, width=400, height=300):
    """Create a branded module thumbnail image."""
    # Create gradient background
    lighter_navy = (44, 82, 130)
    img = create_gradient(width, height, NAVY_BLUE, lighter_navy)
    draw = ImageDraw.Draw(img)
    
    # Draw decorative gold accent line at bottom
    draw.rectangle([(0, height - 8), (width, height)], fill=GOLD)
    
    # Draw a subtle pattern (diagonal lines)
    for i in range(-height, width, 30):
        draw.line([(i, 0), (i + height, height)], fill=(255, 255, 255, 20), width=1)
    
    # Try to use a system font, fall back to default
    try:
        title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 36)
        icon_font = ImageFont.truetype("/System/Library/Fonts/Apple Color Emoji.ttc", 64)
    except:
        title_font = ImageFont.load_default()
        icon_font = title_font
    
    # Draw icon (centered upper area)
    icon_bbox = draw.textbbox((0, 0), icon, font=icon_font)
    icon_width = icon_bbox[2] - icon_bbox[0]
    icon_x = (width - icon_width) // 2
    draw.text((icon_x, 60), icon, font=icon_font, fill=WHITE)
    
    # Draw title (centered)
    lines = title.split('\n')
    y_offset = 150
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=title_font)
        text_width = bbox[2] - bbox[0]
        x = (width - text_width) // 2
        # Draw shadow
        draw.text((x + 2, y_offset + 2), line, font=title_font, fill=(0, 0, 0))
        # Draw text
        draw.text((x, y_offset), line, font=title_font, fill=WHITE)
        y_offset += 45
    
    # Draw gold underline
    underline_width = 100
    underline_x = (width - underline_width) // 2
    draw.rectangle([(underline_x, y_offset + 10), (underline_x + underline_width, y_offset + 14)], fill=GOLD)
    
    return img

def main():
    print(f"Generating module images in: {OUTPUT_DIR}\n")
    
    for module_id, title, icon in MODULES:
        filename = f"{module_id.split('-', 1)[1]}.png"
        output_path = OUTPUT_DIR / filename
        
        img = create_module_image(module_id, title, icon)
        img.save(output_path, 'PNG')
        
        print(f"✓ Created: {filename}")
    
    print(f"\nDone! {len(MODULES)} images created.")
    print(f"Location: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
