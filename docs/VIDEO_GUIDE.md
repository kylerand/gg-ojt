# Video Hosting Guide

This guide explains how to host and reference training videos in the Golfin Garage training system.

## Video Requirements

### Technical Specs
- **Format**: MP4 (H.264 codec recommended)
- **Resolution**: 1280x720 (720p) or 1920x1080 (1080p)
- **Length**: 2-5 minutes per step (keep videos focused)
- **File Size**: Under 100MB per video (compress if needed)
- **Audio**: Clear narration, minimize background noise

### Content Guidelines
- Show task from technician's perspective
- Zoom in on critical details
- Pause briefly on torque specs, diagrams
- Narrate safety warnings clearly
- Demonstrate common mistakes to avoid

## Hosting Options

### Option 1: Cloud Storage (Recommended)

#### Amazon S3
1. **Upload**:
   ```bash
   aws s3 cp video.mp4 s3://golfin-training/videos/01-orientation/step-1.mp4 --acl public-read
   ```

2. **Get URL**:
   ```
   https://golfin-training.s3.amazonaws.com/videos/01-orientation/step-1.mp4
   ```

3. **Use in JSON**:
   ```json
   "videoUrl": "https://golfin-training.s3.amazonaws.com/videos/01-orientation/step-1.mp4"
   ```

#### Cloudinary
1. Upload via web interface
2. Copy public URL
3. Cloudinary optimizes video automatically

**Pros**: Reliable, CDN-backed, fast loading
**Cons**: Monthly cost (but low for this use case)

### Option 2: Local Network Server

Host videos on the same server as the training app:

1. **Create video directory**:
   ```bash
   mkdir -p server/public/videos
   ```

2. **Add static file serving** to `server/server.js`:
   ```javascript
   app.use('/videos', express.static('public/videos'));
   ```

3. **Copy videos**:
   ```bash
   cp video.mp4 server/public/videos/orientation-step-1.mp4
   ```

4. **Reference in JSON**:
   ```json
   "videoUrl": "http://localhost:3001/videos/orientation-step-1.mp4"
   ```

**Pros**: Free, full control, works offline
**Cons**: Slower, uses server bandwidth, manual setup

### Option 3: YouTube (Not Recommended)

- Requires internet connection
- Risk of video removal
- Ads may appear
- Not professional

## Video Organization

### Naming Convention

Use consistent naming:
```
[module-id]-[step-id]-[description].mp4
```

Examples:
- `01-orientation-step-1-welcome.mp4`
- `02-frame-step-2-suspension-mounts.mp4`
- `03-electrical-step-1-battery-tray.mp4`

### Directory Structure (if self-hosting)

```
server/public/videos/
├── 01-orientation/
│   ├── step-1-welcome.mp4
│   ├── step-2-ppe.mp4
│   └── ...
├── 02-frame/
│   ├── step-1-inspection.mp4
│   └── ...
└── thumbnails/
    ├── 01-orientation-thumb.jpg
    └── ...
```

## Creating Video Thumbnails

Thumbnails appear before video plays:

### Using FFmpeg

```bash
# Extract frame at 5 seconds
ffmpeg -i video.mp4 -ss 00:00:05 -vframes 1 thumbnail.jpg
```

### Manually
1. Play video to representative frame
2. Take screenshot
3. Crop to 16:9 ratio
4. Resize to 1280x720 or 640x360

## Updating Videos in JSON

When you have video URL, update module JSON:

```json
{
  "id": "step-1",
  "title": "Battery Tray Installation",
  "videoUrl": "https://your-cdn.com/videos/battery-tray.mp4",
  "videoDuration": 180,
  "videoThumbnail": "https://your-cdn.com/thumbnails/battery-tray.jpg",
  "requiresVideoCompletion": true
}
```

**Fields**:
- `videoUrl` (required): Direct link to MP4 file
- `videoDuration` (optional): Length in seconds (for UI)
- `videoThumbnail` (optional): Poster image URL
- `requiresVideoCompletion` (optional): Block progression until watched

## Placeholder Videos

For development/testing, use placeholder services:

```json
"videoUrl": "https://via.placeholder.com/800x600.mp4?text=Training+Video"
```

Or use a sample video:
```json
"videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
```

## Video Production Tips

### Recording Setup
- **Camera**: Phone or webcam works fine
- **Lighting**: Well-lit workshop, avoid shadows
- **Audio**: Use lapel mic or boom mic
- **Stability**: Use tripod or stable surface

### Recording Process
1. **Plan**: Write script or outline
2. **Rehearse**: Practice without recording
3. **Record**: Multiple takes if needed
4. **Review**: Check audio levels, clarity
5. **Edit**: Trim mistakes, add captions

### Editing Tools
- **Free**: DaVinci Resolve, Shotcut, OpenShot
- **Paid**: Adobe Premiere, Final Cut Pro
- **Basic**: iMovie (Mac), Windows Video Editor

### Editing Checklist
- ✅ Trim dead air at start/end
- ✅ Add title card with step name
- ✅ Highlight critical details (zoom, arrow)
- ✅ Add text overlay for torque specs
- ✅ Normalize audio levels
- ✅ Export as MP4 (H.264)

## Compression

Large videos slow down loading. Compress before uploading:

### Using HandBrake (Free)
1. Open video in HandBrake
2. Preset: "Fast 720p30" or "Fast 1080p30"
3. Set quality: RF 22-24 (good balance)
4. Start encode

### Using FFmpeg
```bash
# Compress to 720p, reasonable quality
ffmpeg -i input.mp4 -vf scale=-2:720 -c:v libx264 -crf 23 -c:a aac -b:a 128k output.mp4
```

**Target**: Under 10MB per minute of video

## Bulk Upload Script

For uploading many videos to S3:

```bash
#!/bin/bash
# upload-videos.sh

for file in videos/*.mp4; do
  filename=$(basename "$file")
  echo "Uploading $filename..."
  aws s3 cp "$file" "s3://golfin-training/videos/$filename" --acl public-read
done

echo "Upload complete!"
```

## Testing Videos

After uploading:

1. **Direct Access**: Open video URL in browser - should play
2. **In App**: Navigate to step - video should load and play
3. **Mobile**: Test on tablet - ensure playback works
4. **Network**: Test on workshop network (not just dev machine)

## Troubleshooting

### Video Won't Play
- **Check URL**: Open directly in browser
- **Check Format**: Must be MP4 (not MOV, AVI, etc.)
- **Check Codec**: Use H.264 (not H.265/HEVC)
- **Check CORS**: If hosted externally, server must allow requests

### CORS Error

If hosting on separate domain, enable CORS:

**S3 Bucket CORS**:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"]
  }
]
```

### Slow Loading
- Compress videos more aggressively
- Use CDN (CloudFront, Cloudflare)
- Lower resolution (720p vs 1080p)
- Reduce bitrate

### Audio Issues
- Normalize audio levels
- Remove background noise (Audacity)
- Add subtitles for noisy environments

## Accessibility

### Captions/Subtitles

Add WebVTT captions:

1. **Create `.vtt` file**:
```vtt
WEBVTT

00:00:00.000 --> 00:00:05.000
Welcome to the battery tray installation step.

00:00:05.000 --> 00:00:10.000
First, inspect the battery tray for damage.
```

2. **Upload alongside video**

3. **Reference in video player** (requires code change)

## Maintenance

### Regular Tasks
- **Monthly**: Check all video URLs still work
- **Quarterly**: Review videos for accuracy (process changes)
- **Yearly**: Re-record outdated videos

### Version Control
- Keep source files (pre-edit)
- Track which videos correspond to which JSON versions
- Date videos in metadata

## Budget Planning

### Cost Estimates (Annual)

**Cloud Hosting (S3 + CloudFront)**:
- Storage: 50GB @ $0.023/GB = $14/month
- Transfer: 500GB @ $0.085/GB = $42/month
- **Total**: ~$670/year

**Self-Hosting**:
- Storage: Local disk space (free)
- Transfer: Local network (free)
- **Total**: $0/year (but slower, requires maintenance)

**Recommendation**: Start self-hosted, move to cloud if performance issues arise.

## Resources

- **Compression**: https://handbrake.fr
- **Editing**: https://www.blackmagicdesign.com/products/davinciresolve
- **S3 Guide**: https://docs.aws.amazon.com/s3/
- **Video Specs**: https://support.google.com/youtube/answer/1722171 (use as reference)

---

**Questions?** Contact IT support or training coordinator.
