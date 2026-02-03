# JSON Schema Documentation

Complete reference for training data JSON schemas.

## Module Schema

File location: `data/modules/*.json`

```typescript
{
  "id": string,                          // Unique module identifier (e.g., "01-orientation")
  "title": string,                       // Display title
  "description": string,                 // Brief overview (1-2 sentences)
  "estimatedTime": string,               // Human-readable time (e.g., "45 minutes")
  "thumbnailUrl": string,                // URL to module thumbnail image
  "prerequisites": string[],             // Array of required module IDs
  "requiresSupervisorSignoff": boolean,  // Does this module need supervisor approval?
  "jobRoles": string[],                  // Array of job roles that should see this module
                                         // Empty array = visible to all roles
  "steps": Step[],                       // Array of training steps
  "knowledgeChecks": KnowledgeCheck[]    // Array of quiz questions
}
```

### Job Roles

Modules can be targeted to specific job roles. If `jobRoles` is empty or not specified, the module is visible to all users.

Available job roles:
- `Assembly Technician`
- `Lead Assembly Technician`
- `Quality Inspector`
- `Electrical Specialist`
- `Frame & Chassis Specialist`
- `Paint & Body Technician`
- `Sales`
- `Supervisor`
- `Trainer`
- `Maintenance Technician`
- `Warehouse Associate`

**Note**: Admins and Supervisors always see all modules regardless of their job role setting.
```

## Step Schema

```typescript
{
  "id": string,                          // Unique step ID within module (e.g., "step-1")
  "title": string,                       // Step title
  "instructions": string,                // Detailed instructions (supports \n for newlines)
  "videoUrl": string | null,             // URL to instructional video (optional)
  "videoDuration": number | null,        // Video length in seconds (optional)
  "videoThumbnail": string | null,       // Video poster image URL (optional)
  "tools": string[],                     // Required tools (optional)
  "materials": string[],                 // Required materials/parts (optional)
  "safetyWarnings": SafetyWarning[],     // Safety warnings (optional)
  "commonMistakes": string[],            // Common errors to avoid (optional)
  "whyItMatters": string | null,         // Educational context (optional)
  "diagrams": string[],                  // URLs to diagrams/images (optional)
  "requiresConfirmation": boolean,       // User must confirm completion (default: false)
  "requiresVideoCompletion": boolean     // Must watch video fully (default: false)
}
```

## Safety Warning Schema

```typescript
{
  "severity": "danger" | "warning",      // "danger" = critical, "warning" = caution
  "text": string                         // Warning message
}
```

**Display**:
- `danger`: Red background, used for serious injury/death risk
- `warning`: Yellow background, used for minor injury/damage risk

## Knowledge Check Schema

```typescript
{
  "id": string,                          // Unique question ID (e.g., "check-1")
  "question": string,                    // Question text
  "type": "multiple-choice",             // Currently only multiple-choice supported
  "options": string[],                   // Answer options (array of strings)
  "correctAnswer": number,               // Index of correct answer (0-based)
  "explanation": string,                 // Why this answer is correct
  "videoReference": string | null        // Optional: URL to explanation video
}
```

**Example**:
```json
{
  "id": "check-1",
  "question": "What is the first step before working on electrical systems?",
  "type": "multiple-choice",
  "options": [
    "Put on gloves",
    "Disconnect the batteries",
    "Get a supervisor",
    "Read the manual"
  ],
  "correctAnswer": 1,
  "explanation": "Always disconnect batteries first to prevent electrical shock and short circuits."
}
```

## Cart Configuration Schema

File location: `data/carts/*.json`

```typescript
{
  "id": string,                          // Unique cart ID (e.g., "electric-standard")
  "name": string,                        // Display name
  "description": string,                 // Brief description
  "type": "electric" | "gas",            // Cart type
  "batterySystem": {                     // For electric carts
    "voltage": number,
    "type": string,
    "count": number,
    "batteryVoltage": number
  },
  "motor": {
    "type": string,
    "power": string,
    "manufacturer": string
  },
  "features": string[],                  // List of cart features
  "modules": string[]                    // Required module IDs in order
}
```

## Progress Schema

File location: `progress/*.json` (runtime, auto-generated)

```typescript
{
  "traineeId": string,                   // Employee ID
  "traineeName": string,                 // Full name
  "cartType": string,                    // Cart configuration ID
  "startedAt": string,                   // ISO 8601 timestamp
  "lastActivity": string,                // ISO 8601 timestamp (auto-updated)
  "completedModules": string[],          // Array of completed module IDs
  "currentModule": string | null,        // Current module ID
  "currentStep": string | null,          // Current step ID
  "moduleProgress": {
    [moduleId: string]: {
      "status": "in_progress" | "completed",
      "startedAt": string,               // ISO 8601 timestamp
      "completedAt": string | null,      // ISO 8601 timestamp
      "completedSteps": string[],        // Array of completed step IDs
      "knowledgeCheckScore": string | null,  // e.g., "4/5 (80%)"
      "supervisorSignoff": boolean,
      "supervisorName": string | null,   // Name of supervisor who signed off
      "signoffAt": string | null         // ISO 8601 timestamp
    }
  }
}
```

## Validation Rules

### Module Validation
- `id` must match filename (without `.json` extension)
- `id` must be lowercase, use hyphens (not spaces or underscores)
- `prerequisites` must reference existing module IDs
- `steps` array must not be empty
- Each step `id` must be unique within module
- `knowledgeChecks` array must have at least 1 question

### Step Validation
- If `requiresVideoCompletion` is `true`, `videoUrl` must be provided
- `tools` and `materials` should be arrays (can be empty)
- `safetyWarnings` severity must be "danger" or "warning"
- If safety warnings exist, they should be meaningful (not empty strings)

### Knowledge Check Validation
- `correctAnswer` must be valid index (0 to options.length - 1)
- `options` array must have at least 2 options
- `explanation` should be clear and educational

### Cart Config Validation
- `modules` array must contain valid module IDs
- `modules` should be in logical training order
- If `prerequisites` are defined in modules, order must respect them

## Field Constraints

| Field | Max Length | Pattern | Notes |
|-------|------------|---------|-------|
| module.id | 50 | `[a-z0-9-]+` | Lowercase, hyphens only |
| module.title | 100 | Any | Display name |
| step.id | 50 | `step-[0-9]+` | Recommended pattern |
| step.instructions | 5000 | Any | Long text field |
| traineeId | 50 | `[a-zA-Z0-9-]+` | Alphanumeric + hyphens |

## API Data Types

### GET /api/modules Response
```typescript
Array<{
  id: string,
  title: string,
  description: string,
  estimatedTime: string,
  thumbnailUrl: string,
  prerequisites: string[],
  stepCount: number,                     // Computed from steps.length
  requiresSupervisorSignoff: boolean
}>
```

### GET /api/modules/:moduleId Response
Returns full Module schema (see above)

### POST /api/progress Request
```typescript
{
  "traineeId": string,
  "traineeName": string,
  "cartType": string
}
```

### PUT /api/progress/:traineeId/step Request
```typescript
{
  "moduleId": string,
  "stepId": string,
  "completed": boolean,
  "stepData": {
    "confirmed": boolean,
    "videoCompleted": boolean,
    "safetyAcknowledged": boolean
  }
}
```

### PUT /api/progress/:traineeId/complete-module Request
```typescript
{
  "moduleId": string,
  "knowledgeCheckScore": string          // e.g., "4/5 (80%)"
}
```

## Common Patterns

### Module ID Convention
```
[number]-[name]
```
Examples: `01-orientation`, `02-frame-chassis`, `03-electrical`

Rationale: Numbers ensure sort order, names are human-readable

### Step ID Convention
```
step-[number]
```
Examples: `step-1`, `step-2`, `step-3`

Rationale: Simple, sequential, no need for complex naming

### Video URL Patterns

**Cloud CDN**:
```
https://cdn.example.com/videos/[module-id]/[step-id].mp4
```

**Local**:
```
http://localhost:3001/videos/[module-id]-[step-id].mp4
```

## Example: Complete Module

See `data/modules/01-orientation.json` for a comprehensive example with:
- Multiple steps
- Safety warnings (danger + warning)
- Tools and materials
- Common mistakes
- "Why it matters" sections
- Knowledge checks with explanations

## JSON Tips

### Escaping Special Characters
- Quotes: `"Use \"quoted\" text"`
- Backslash: `"Path: C:\\folder\\file"`
- Newlines: `"Line 1\nLine 2"`

### Multi-line Instructions
```json
"instructions": "First paragraph with setup details.\n\nSecond paragraph with step-by-step instructions.\n\nThird paragraph with verification steps."
```

### Optional vs Required
- If field is optional and not used, omit it entirely (don't set to null)
- Exception: Progress data (auto-generated) uses null for pending values

## Validation Tools

### Online JSON Validator
- https://jsonlint.com - Syntax validation
- https://www.jsonschemavalidator.net - Schema validation

### Command Line
```bash
# Validate JSON syntax
python -m json.tool data/modules/01-orientation.json

# Or with jq
jq empty data/modules/01-orientation.json
```

## Schema Evolution

When adding new fields:
1. Add to schema documentation
2. Make field optional (for backward compatibility)
3. Provide sensible default if not present
4. Update all existing modules (or let them use default)

Example: Adding `videoCaptions` field:
- Add as optional field
- Default: null (no captions)
- Existing modules work without changes
- New modules can include captions

---

**Version**: 1.0
**Last Updated**: 2026-01-27
