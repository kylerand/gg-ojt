#!/usr/bin/env python3
"""Generate module thumbnail images using Stable Diffusion."""

import torch
from diffusers import StableDiffusionPipeline
from pathlib import Path

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent / "client" / "public" / "images" / "modules"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Module image prompts - golf cart assembly training themed
MODULES = {
    "01-orientation": {
        "filename": "orientation.png",
        "prompt": "Professional industrial workshop safety training, workers wearing safety gear hard hats and high visibility vests, clean modern manufacturing facility, warm lighting, professional photography style, 4k quality"
    },
    "02-frame-chassis": {
        "filename": "frame-chassis.png",
        "prompt": "Golf cart metal frame and chassis assembly on workbench, industrial manufacturing, steel frame components, professional workshop environment, clean modern factory, technical precision, 4k quality"
    },
    "03-electrical": {
        "filename": "electrical.png",
        "prompt": "Electric vehicle battery pack and wiring harness installation, lithium batteries, electrical components on workbench, professional technician work, clean modern workshop, technical precision, 4k quality"
    },
    "04-drivetrain": {
        "filename": "drivetrain.png",
        "prompt": "Electric motor and drivetrain components for golf cart, motor controller, gears and axle assembly, professional automotive workshop, technical precision engineering, 4k quality"
    },
    "05-steering-suspension": {
        "filename": "steering-suspension.png",
        "prompt": "Golf cart steering column and suspension system assembly, springs shocks and steering linkage, automotive workshop, professional mechanical work, technical precision, 4k quality"
    },
    "06-body-accessories": {
        "filename": "body-accessories.png",
        "prompt": "Custom vintage style golf cart with navy blue body panels, retro Ford inspired design, leather seats, premium accessories, showroom quality, professional photography, 4k quality"
    },
    "07-quality-inspection": {
        "filename": "quality-inspection.png",
        "prompt": "Quality control inspector with clipboard checking finished golf cart, professional inspection process, checklist verification, clean workshop environment, professional photography, 4k quality"
    }
}

def main():
    print("Loading Stable Diffusion model...")
    
    # Use a lighter model for faster generation
    model_id = "stabilityai/stable-diffusion-2-1-base"
    
    # Detect device
    if torch.cuda.is_available():
        device = "cuda"
        dtype = torch.float16
    elif torch.backends.mps.is_available():
        device = "mps"
        dtype = torch.float32
    else:
        device = "cpu"
        dtype = torch.float32
    
    print(f"Using device: {device}")
    
    pipe = StableDiffusionPipeline.from_pretrained(
        model_id,
        torch_dtype=dtype,
        safety_checker=None
    )
    pipe = pipe.to(device)
    
    # Enable memory optimizations
    if device == "cuda":
        pipe.enable_attention_slicing()
    
    print(f"\nGenerating {len(MODULES)} module images...\n")
    
    for module_id, config in MODULES.items():
        output_path = OUTPUT_DIR / config["filename"]
        print(f"Generating: {module_id}")
        print(f"  Prompt: {config['prompt'][:60]}...")
        
        # Generate image
        image = pipe(
            prompt=config["prompt"],
            negative_prompt="blurry, low quality, distorted, cartoon, anime, illustration, text, watermark",
            num_inference_steps=30,
            guidance_scale=7.5,
            width=512,
            height=384
        ).images[0]
        
        # Save image
        image.save(output_path)
        print(f"  Saved: {output_path}\n")
    
    print("Done! All module images generated.")
    print(f"Images saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
