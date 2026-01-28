# Golfin Garage On-the-Job Training System

A web-based training application for golf cart assembly technicians. Features video-based instruction, step-by-step guidance, safety protocols, and knowledge checks.

## 🚀 Features

- **Video-Based Learning**: Each training step includes instructional videos
- **Step-by-Step Guidance**: Clear, detailed instructions for every assembly task
- **Safety-First Design**: Prominent safety warnings with required acknowledgments
- **Knowledge Checks**: Quiz questions ensure comprehension
- **Progress Tracking**: Resume training exactly where you left off
- **Supervisor Sign-Off**: Critical modules require supervisor approval
- **Admin Dashboard**: Monitor all trainee progress
- **Data-Driven Content**: Update training material without touching code

## 📋 Prerequisites

- Node.js 18+ (18.x or higher recommended)
- npm 8+
- Modern web browser (Chrome, Firefox, Safari)

## 🛠️ Installation

### 1. Clone or Download
```bash
cd /path/to/gg-ojt
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Install server dependencies
cd server && npm install && cd ..
```

### 3. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env if needed (defaults work for local development)
```

### 4. Start the Application

**Option A: Use the startup script (Recommended)**
```bash
./start.sh
```

**Option B: Manual start with concurrently**
```bash
npm run dev
```

**Option C: Start client and server separately**
```bash
# Terminal 1 - Start server
cd server && npm run dev

# Terminal 2 - Start client
cd client && npm run dev
```

### 5. Access the Application
- **Training Application**: http://localhost:3000
- **Backend API**: http://localhost:3001/api

## 🎓 Usage

### For Trainees

1. **Login**: Enter your employee ID at the login screen
2. **First Time**: If it's your first login, you'll create your profile
3. **Select Module**: Choose a training module from the home page
4. **Complete Steps**: Work through each step, watching videos and reading instructions
5. **Acknowledge Safety**: Check all safety warnings before proceeding
6. **Take Quiz**: After completing all steps, take the knowledge check
7. **Track Progress**: View your progress at any time

### For Supervisors

- Access the admin dashboard at `/admin`
- View all trainee progress
- Reset trainee progress if needed
- Provide sign-offs for critical modules

## 📁 Project Structure

```
gg-ojt/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service layer
│   │   ├── context/     # React context (state)
│   │   └── styles/      # CSS stylesheets
│   └── public/          # Static assets
├── server/              # Express backend
│   ├── routes/          # API routes
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── storage/         # File I/O operations
│   └── middleware/      # Express middleware
├── data/                # Training content (JSON)
│   ├── modules/         # Training modules
│   └── carts/           # Cart configurations
├── progress/            # Trainee progress files (runtime)
├── docs/                # Documentation
└── start.sh             # Startup script
```

## 🎬 Training Content

### Included Modules

1. **Orientation & Safety** (45 min) - Safety protocols, PPE, emergency procedures ⚠️
2. **Frame & Chassis Assembly** (90 min) - Structural foundation
3. **Electrical System** (120 min) - Battery, wiring, controller ⚠️
4. **Drivetrain & Motor** (90 min) - Motor and drive components
5. **Steering & Suspension** (75 min) - Steering and suspension systems
6. **Body & Accessories** (60 min) - Panels, seats, lights
7. **Quality Inspection** (45 min) - Final checks and testing ⚠️

⚠️ = Requires supervisor sign-off

### Module Content

Each module includes:
- Video demonstrations for each step
- Detailed text instructions
- Required tools and materials list
- Safety warnings (with acknowledgment requirement)
- Common mistakes to avoid
- "Why This Matters" educational context
- Knowledge check questions

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Client Configuration
VITE_API_URL=http://localhost:3001

# Data Paths
DATA_PATH=./data
PROGRESS_PATH=./progress
```

### Customizing Training Content

See [CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md) for detailed instructions on:
- Adding new modules
- Updating existing content
- Uploading and referencing videos
- Creating knowledge checks

## 📊 API Endpoints

### Modules
- `GET /api/modules` - List all modules
- `GET /api/modules/:moduleId` - Get module details
- `GET /api/modules/cart/:cartType` - Get cart configuration

### Progress
- `GET /api/progress/:traineeId` - Get trainee progress
- `POST /api/progress` - Create new progress
- `PUT /api/progress/:traineeId/step` - Update step progress
- `PUT /api/progress/:traineeId/complete-module` - Complete module
- `PUT /api/progress/:traineeId/supervisor-signoff` - Add supervisor sign-off

### Admin
- `GET /api/admin/trainees` - Get all trainees
- `DELETE /api/admin/progress/:traineeId` - Reset progress

## 🚀 Deployment

### Local Network Deployment

1. **Set Static IP**: Configure server machine with static IP
2. **Update Environment**: Set `VITE_API_URL` to server IP:port
3. **Build Client**:
   ```bash
   cd client && npm run build
   ```
4. **Serve with PM2**:
   ```bash
   npm install -g pm2
   pm2 start server/server.js --name gg-training
   pm2 startup  # Enable auto-start on reboot
   pm2 save
   ```
5. **Access**: Navigate to `http://<server-ip>:3001` from any workshop device

### Optional: Nginx Reverse Proxy

For production, use Nginx to serve client and proxy API:
```nginx
server {
    listen 80;
    
    # Serve React client
    location / {
        root /path/to/gg-ojt/client/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests
    location /api {
        proxy_pass http://localhost:3001;
    }
}
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Module Not Loading
- Check that JSON files are in `data/modules/`
- Verify JSON syntax is valid
- Check server console for errors

### Video Not Playing
- Verify video URL is accessible
- Check browser console for errors
- Ensure video format is supported (MP4 recommended)

### Progress Not Saving
- Check `progress/` directory exists and is writable
- Verify file permissions
- Check server logs for write errors

## 📝 Development

### Adding a New Component
```bash
# Create component file
touch client/src/components/common/MyComponent.jsx

# Use in pages/components
import MyComponent from '../components/common/MyComponent';
```

### Modifying API
1. Add route in `server/routes/`
2. Create controller in `server/controllers/`
3. Update service logic in `server/services/`
4. Add API call in `client/src/services/api.js`

### Updating Styles
- Global styles: `client/src/styles/main.css`
- Component-specific: Inline styles or CSS modules

## 🔒 Security Considerations

- **No Authentication**: Current version uses employee ID only
- **Local Network**: Designed for trusted local network deployment
- **Data Privacy**: Progress files stored locally (not encrypted)
- **Production**: Add authentication (OAuth, LDAP) before external deployment

## 📚 Additional Documentation

- [Content Update Guide](docs/CONTENT_GUIDE.md) - How to update training content
- [Video Hosting Guide](docs/VIDEO_GUIDE.md) - Video upload and hosting
- [JSON Schema](docs/SCHEMA.md) - Training data format specification

## 🤝 Support

For technical issues or questions:
1. Check troubleshooting section above
2. Review API logs: `server/logs/`
3. Check browser console for frontend errors
4. Contact IT support

## 📄 License

Copyright © 2026 Golfin Garage. All rights reserved.

---

**Built for Golfin Garage workshop technicians** 🏌️⚙️
