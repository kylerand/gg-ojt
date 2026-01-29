# Cloudflare R2 Setup Guide

This guide walks you through setting up Cloudflare R2 for video and media storage in the GG OJT Training System.

## Why Cloudflare R2?

| Feature | Supabase Free | Cloudflare R2 Free |
|---------|---------------|-------------------|
| Storage | 1 GB | 10 GB |
| Bandwidth | 2 GB/month | Unlimited egress |
| File size limit | 50 MB | 5 GB |
| Cost after free tier | $0.021/GB | $0.015/GB |

R2 is ideal for video hosting due to unlimited egress (no bandwidth costs when videos are streamed).

## 1. Create a Cloudflare Account

1. Go to [cloudflare.com](https://cloudflare.com) and sign up/login
2. Navigate to **R2 Object Storage** in the left sidebar
3. Click **Create bucket**

## 2. Create an R2 Bucket

1. **Bucket name**: `gg-training-media` (or your preferred name)
2. **Location**: Choose closest to your users (Auto is fine)
3. Click **Create bucket**

## 3. Enable Public Access

1. Click on your bucket name
2. Go to **Settings** tab
3. Under **Public access**, click **Allow Access**
4. Copy the **Public bucket URL** (looks like `https://pub-xxxxx.r2.dev`)

## 4. Create API Tokens

1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API Token**
3. Configure the token:
   - **Token name**: `gg-ojt-production`
   - **Permissions**: `Object Read & Write`
   - **Bucket**: Select your bucket
4. Click **Create API Token**
5. **Save these values immediately** (shown only once):
   - **Access Key ID**
   - **Secret Access Key**
6. Also note your **Account ID** from the URL or R2 overview page

## 5. Configure Railway

Add these environment variables in Railway:

| Variable | Value |
|----------|-------|
| `R2_ACCOUNT_ID` | Your Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | The Access Key ID from step 4 |
| `R2_SECRET_ACCESS_KEY` | The Secret Access Key from step 4 |
| `R2_BUCKET_NAME` | `gg-training-media` (your bucket name) |
| `R2_PUBLIC_URL` | `https://pub-xxxxx.r2.dev` (your public URL) |

## 6. Local Development

For local development, create a `.env` file in the `server/` directory:

```env
# Cloudflare R2 (optional for local)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=gg-training-media
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

If R2 credentials are not set, the system falls back to local file storage.

## 7. Verify Setup

After redeploying, check the Railway logs. You should see:

```
🪣 StorageService using Cloudflare R2
✅ Server is running on port 3001
```

Upload a video through the admin panel - you should see:
- Progress bar during upload
- Video URL pointing to your R2 public domain

## Storage Priority

The system checks for storage providers in this order:

1. **Cloudflare R2** - If R2 credentials are configured
2. **Supabase Storage** - If Supabase credentials are configured
3. **Local Storage** - Fallback for development

## File Organization

Files are organized in R2 as follows:

```
gg-training-media/
├── videos/
│   ├── step-video-1234567890.mp4
│   └── orientation-intro-9876543210.mp4
├── images/
│   ├── module-thumbnail-1234567890.jpg
│   └── step-diagram-9876543210.png
└── thumbnails/
    └── module-1-cover.jpg
```

## Upload Features

The VideoUploader component provides:
- 📊 Real-time progress bar
- 📈 Upload speed display
- ⏱️ Time remaining estimate
- ❌ Cancel upload button
- 🖱️ Drag & drop support
- 📹 Video preview after upload

## Troubleshooting

### "Access Denied" errors
- Verify your API token has `Object Read & Write` permissions
- Check the token is scoped to the correct bucket
- Ensure the bucket is set to allow public access

### Videos not playing
- Check the `R2_PUBLIC_URL` is correct
- Verify the bucket has public access enabled
- Try accessing the URL directly in a browser

### Upload fails at 100%
- Check Railway logs for specific error messages
- Verify the file size is under 500MB
- Ensure the file type is allowed (mp4, webm, mov)

### Progress bar not showing
- The progress indicator uses XMLHttpRequest
- Check browser console for any JavaScript errors

## Cost Estimation

For a training platform with 100 trainees:
- 50 training videos @ 100MB each = 5GB storage
- 100 trainees watching 10 videos/month @ 100MB = 100GB bandwidth

| Provider | Monthly Cost |
|----------|-------------|
| Cloudflare R2 | **$0** (within free tier) |
| AWS S3 | ~$9 (mostly bandwidth) |
| Supabase Pro | $25 (includes 100GB bandwidth) |

R2's zero egress fees make it ideal for video streaming applications.
