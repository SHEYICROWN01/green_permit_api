# Green Permit API

A robust and scalable REST API built with Node.js and Express.js for the Green Permit application.

## 🚀 Features

- ✅ RESTful API architecture
- ✅ Express.js framework
- ✅ MySQL database integration
- ✅ JWT authentication
- ✅ Environment-based configuration
- ✅ Request validation with express-validator
- ✅ Error handling middleware
- ✅ Security best practices (Helmet, CORS, Rate Limiting)
- ✅ Production-ready logging with Winston
- ✅ Response compression
- ✅ PM2 process management
- ✅ Docker support
- ✅ Database migrations & backups
- ✅ Health check endpoint

## 📋 Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd green-permit-api
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
NODE_ENV=development
PORT=3000
HOST=localhost
API_PREFIX=/api/v1
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=green_permit_db
JWT_SECRET=your_secret_key
```

5. Setup database:
```bash
npm run db:init
```

## 🏃 Running the Application

### Development mode (with hot reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

### With PM2 (recommended for production):
```bash
npm run start:pm2
```

### With Docker:
```bash
npm run docker:run
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## 📚 API Endpoints

### Health Check
- **GET** `/health` - Check server health status

### Super Admin API
- **POST** `/api/v1/super-admin/auth/login` - Super admin login
- **GET** `/api/v1/super-admin/dashboard` - Dashboard overview
- **GET** `/api/v1/super-admin/stickers/*` - Sticker management
- **GET** `/api/v1/super-admin/lgas/*` - LGA management
- And more...

### Officer Mobile API
- **POST** `/api/v1/officer/auth/login` - Officer login
- **GET** `/api/v1/officer/dashboard/overview` - Officer dashboard
- **POST** `/api/v1/officer/stickers/:id/activate` - Activate sticker
- **GET** `/api/v1/officer/stickers/:id/verify` - Verify sticker
- **GET** `/api/v1/officer/reports/sales` - Sales reports
- And more...

📖 **Full API Documentation:** See `docs/OFFICER_MOBILE_API.md` for complete endpoint details.

## 🚀 Deployment

### Namecheap cPanel Hosting (Recommended for Shared Hosting)

**Quick Start (30 minutes):**
```bash
# 1. Prepare files
cp .env.cpanel .env
# Edit .env with your cPanel database credentials

# 2. Create zip file
zip -r green-permit-api.zip . -x "node_modules/*" ".git/*"

# 3. Follow the guide
```

📘 **Complete Guide:** [NAMECHEAP_DEPLOYMENT.md](./NAMECHEAP_DEPLOYMENT.md)  
❓ **FAQ & Troubleshooting:** [CPANEL_FAQ.md](./CPANEL_FAQ.md)  
⚡ **Quick Start:** [QUICK_START_CPANEL.md](./QUICK_START_CPANEL.md)

### Docker Deployment

```bash
# Build and run with Docker Compose
npm run docker:build
npm run docker:run

# Stop containers
npm run docker:stop
```

### Traditional VPS/Cloud Deployment

```bash
# With PM2
npm run start:pm2
pm2 save
pm2 startup

# Configure Nginx reverse proxy
# See DEPLOYMENT.md for details
```

📘 **Complete Deployment Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)  
✅ **Production Checklist:** [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)  
📦 **Production Setup Summary:** [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)

### Cloud Platforms

- **AWS:** Elastic Beanstalk, EC2, or ECS
- **DigitalOcean:** App Platform or Droplets
- **Heroku:** Ready to deploy
- **Google Cloud:** Cloud Run or App Engine

See [DEPLOYMENT.md](./DEPLOYMENT.md) for platform-specific guides.

## 📁 Project Structure

```
green-permit-api/
├── src/
│   ├── config/           # Configuration files
│   │   └── env.config.js
│   ├── controllers/      # Route controllers
│   │   └── example.controller.js
│   ├── middleware/       # Custom middleware
│   │   ├── asyncHandler.js
│   │   ├── errorHandler.js
│   │   ├── notFoundHandler.js
│   │   └── validate.js
│   ├── models/          # Data models (add your DB models here)
│   ├── routes/          # API routes
│   │   ├── index.js
│   │   └── example.routes.js
│   ├── utils/           # Utility functions
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   └── logger.js
│   ├── validators/      # Request validators
│   │   └── example.validator.js
│   ├── app.js           # Express app configuration
│   └── server.js        # Server entry point
├── tests/               # Test files
├── .env.example         # Example environment variables
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies and scripts
└── README.md           # This file
```

## 🧪 Testing

```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 🔍 Linting

Check code style:
```bash
npm run lint
```

Auto-fix linting issues:
```bash
npm run lint:fix
```

## 🔐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Server port | 3000 |
| HOST | Server host | localhost |
| API_PREFIX | API route prefix | /api/v1 |
| CORS_ORIGIN | CORS allowed origin | * |
| RATE_LIMIT_WINDOW_MS | Rate limit window (ms) | 900000 |
| RATE_LIMIT_MAX_REQUESTS | Max requests per window | 100 |
| LOG_LEVEL | Logging level | info |

## 🏗️ Development Guidelines

### Adding New Routes

1. Create a controller in `src/controllers/`
2. Create validation rules in `src/validators/`
3. Create route file in `src/routes/`
4. Register route in `src/routes/index.js`

### Error Handling

Use the `ApiError` utility class for throwing errors:
```javascript
const ApiError = require('../utils/ApiError');
throw new ApiError(404, 'Resource not found');
```

### Response Format

Use the `ApiResponse` utility class for consistent responses:
```javascript
const ApiResponse = require('../utils/ApiResponse');
ApiResponse.success(res, data, 'Success message');
```

### Async Route Handlers

Wrap async handlers with `asyncHandler`:
```javascript
const asyncHandler = require('../middleware/asyncHandler');

const myHandler = asyncHandler(async (req, res) => {
  // Your async code here
});
```

## 🚀 Next Steps

1. **Database Integration**: Add your preferred database (MongoDB, PostgreSQL, etc.)
2. **Authentication**: Implement JWT or session-based authentication
3. **Authorization**: Add role-based access control
4. **API Documentation**: Set up Swagger/OpenAPI documentation
5. **Testing**: Add unit and integration tests
6. **Logging**: Enhance logging with Winston or similar
7. **Monitoring**: Add monitoring and performance tracking

## 📝 License

ISC

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.
