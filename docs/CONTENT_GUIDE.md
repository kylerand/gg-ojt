# Training Content Update Guide

This guide explains how to update training content without modifying any code. All training material is stored in JSON files in the `data/` directory.

## Quick Reference

- **Module Files**: `data/modules/*.json`
- **Cart Configs**: `data/carts/*.json`
- **After Editing**: Server automatically reloads JSON files (no restart needed in dev mode)

## Module Structure

Each training module is a single JSON file with this structure:

```json
{
  "id": "module-id",
  "title": "Module Title",
  "description": "Brief description",
  "estimatedTime": "60 minutes",
  "thumbnailUrl": "https://url-to-thumbnail.jpg",
  "prerequisites": ["other-module-id"],
  "requiresSupervisorSignoff": true,
  "steps": [...],
  "knowledgeChecks": [...]
}
```

## Adding a New Module

1. **Create JSON file** in `data/modules/`:
   ```bash
   touch data/modules/08-advanced-diagnostics.json
   ```

2. **Copy template** from existing module (e.g., `01-orientation.json`)

3. **Update content**:
   - Change `id` to unique identifier
   - Update title, description, time estimate
   - Modify steps array
   - Add knowledge check questions

4. **Test**: Refresh browser - new module appears automatically

## Editing Steps

Each step in the `steps` array follows this format:

```json
{
  "id": "step-1",
  "title": "Step Title",
  "instructions": "Detailed instructions here.\n\nUse \\n\\n for paragraphs.",
  "videoUrl": "https://your-video-cdn.com/video.mp4",
  "videoDuration": 180,
  "videoThumbnail": "https://your-video-cdn.com/thumb.jpg",
  "tools": ["Tool 1", "Tool 2"],
  "materials": ["Part 1", "Part 2"],
  "safetyWarnings": [
    {
      "severity": "danger",
      "text": "Warning message"
    }
  ],
  "commonMistakes": ["Mistake description"],
  "whyItMatters": "Educational context",
  "diagrams": ["https://url-to-diagram.jpg"],
  "requiresConfirmation": true,
  "requiresVideoCompletion": true
}
```

### Field Guide

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique step identifier (e.g., "step-1") |
| `title` | Yes | Short step title |
| `instructions` | Yes | Detailed text instructions |
| `videoUrl` | No | URL to instructional video |
| `videoDuration` | No | Video length in seconds |
| `tools` | No | Array of required tools |
| `materials` | No | Array of required materials/parts |
| `safetyWarnings` | No | Array of safety warnings (see below) |
| `commonMistakes` | No | Array of mistakes to avoid |
| `whyItMatters` | No | Educational context (why step is important) |
| `requiresConfirmation` | No | User must confirm completion (default: false) |
| `requiresVideoCompletion` | No | Must watch full video before proceeding |

### Safety Warnings

Safety warnings have two severity levels:

**Danger** (Red background, critical safety):
```json
{
  "severity": "danger",
  "text": "Always disconnect batteries before working on electrical systems"
}
```

**Warning** (Yellow background, caution):
```json
{
  "severity": "warning",
  "text": "Component is heavy. Use proper lifting techniques"
}
```

## Knowledge Checks

Add quiz questions to verify comprehension:

```json
{
  "id": "check-1",
  "question": "What should you do before working on electrical components?",
  "type": "multiple-choice",
  "options": [
    "Work quickly",
    "Disconnect the batteries",
    "Wear rubber gloves",
    "Have someone watch"
  ],
  "correctAnswer": 1,
  "explanation": "Always disconnect batteries first. This is the #1 electrical safety rule.",
  "videoReference": "https://optional-explanation-video.mp4"
}
```

- `correctAnswer`: Zero-indexed (0 = first option, 1 = second option, etc.)
- Passing score: 80% (4 out of 5 questions)
- Failed quizzes require module review and retry

## Best Practices

### Writing Instructions

✅ **Good**:
```
Install the front suspension brackets to the frame. Apply thread locker to all bolts. Torque bolts to 45 ft-lbs using a star pattern starting from the center.
```

❌ **Bad**:
```
Put the brackets on and tighten.
```

**Tips**:
- Be specific with torque specs
- Mention patterns (star, clockwise, etc.)
- Include "why" when it prevents errors
- Use numbered steps for sequences
- Break long instructions into paragraphs

### Safety Warnings

✅ **Use "danger" for**:
- Risk of injury
- Risk of death
- Risk of fire/explosion
- Electrical hazards
- Equipment damage that creates safety issues

✅ **Use "warning" for**:
- Risk of minor injury
- Risk of equipment damage
- Best practices that prevent problems

**Writing Safety Warnings**:
- Start with action word (NEVER, ALWAYS, ENSURE)
- Be specific about consequence
- Keep it brief and scannable

Examples:
- ✅ "NEVER connect batteries with reversed polarity. This WILL cause fire or explosion."
- ❌ "Be careful with batteries."

### Common Mistakes

Help trainees avoid errors by listing common mistakes:

```json
"commonMistakes": [
  "Not using thread locker on suspension bolts",
  "Overtightening and stripping threads",
  "Skipping the star pattern when torquing"
]
```

## Cart Configurations

Cart configs define which modules are required:

```json
{
  "id": "electric-standard",
  "name": "Standard Electric Golf Cart",
  "description": "4-passenger electric cart",
  "type": "electric",
  "modules": [
    "01-orientation",
    "02-frame-chassis",
    "03-electrical",
    "04-drivetrain",
    "05-steering-suspension",
    "06-body-accessories",
    "07-quality-inspection"
  ]
}
```

To create a new cart configuration:
1. Copy `electric-standard.json`
2. Rename file (e.g., `electric-premium.json`)
3. Update `id`, `name`, and `modules` array
4. Add/remove modules as needed

## Testing Changes

1. **Syntax Validation**: Use a JSON validator (https://jsonlint.com)
2. **Local Test**: Refresh browser - changes appear immediately
3. **Check Console**: Open browser dev tools to see any errors
4. **Test Flow**: Complete a step to ensure everything works

## Common Issues

### Module Doesn't Appear
- Check file is in `data/modules/` directory
- Verify file name ends with `.json`
- Validate JSON syntax (missing comma, bracket, etc.)
- Check `id` field matches filename without extension

### Video Won't Play
- Verify URL is accessible (open in browser)
- Check video format (MP4 recommended)
- Ensure HTTPS if app is served over HTTPS
- Test video URL independently

### Safety Warnings Don't Show
- Check `safetyWarnings` is an array `[]`
- Verify each warning has `severity` and `text`
- Confirm severity is either `"danger"` or `"warning"`

## JSON Tips

### Common Syntax Errors

❌ **Trailing comma**:
```json
{
  "id": "step-1",
  "title": "Title",  // ← Remove this comma
}
```

✅ **Correct**:
```json
{
  "id": "step-1",
  "title": "Title"
}
```

❌ **Unescaped quotes**:
```json
"instructions": "Use 3/4" socket"  // ← Breaks JSON
```

✅ **Escaped quotes**:
```json
"instructions": "Use 3/4\" socket"
```

### Multi-line Text

Use `\n\n` for paragraphs:

```json
"instructions": "First paragraph explains the task.\n\nSecond paragraph provides details.\n\nThird paragraph adds context."
```

## Updating Video URLs

When you upload new videos:

1. Upload video to hosting service (S3, Cloudinary, etc.)
2. Get permanent URL
3. Update `videoUrl` in step
4. Optionally update `videoThumbnail` and `videoDuration`
5. Test video plays in browser

See [VIDEO_GUIDE.md](VIDEO_GUIDE.md) for video hosting setup.

## Version Control

**Recommended**: Use git to track changes:

```bash
# Before editing
git add data/modules/01-orientation.json
git commit -m "Updating orientation safety section"

# After testing
git push
```

This allows you to:
- See what changed
- Revert mistakes
- Collaborate with others

## Getting Help

- JSON syntax errors: Use https://jsonlint.com
- Can't find field: Check this guide or existing modules
- Videos not working: See VIDEO_GUIDE.md
- Technical issues: Contact IT support
