# Car Rental System - Backend

A robust Node.js backend for a Car Rental System, featuring a comprehensive DevSecOps pipeline, 100% test coverage, and a secure containerized environment.

## 🚀 Public URL
- **Backend (Vercel):** [https://se-project-be-68-2-deemaknisit.vercel.app/](https://se-project-be-68-2-deemaknisit.vercel.app/)

## ✨ Key Features
- **Review System**: Fully implemented API for creating, reading, updating, and deleting car reviews.
- **Wishlist Management**: User-specific wishlists to save favorite cars for later.
- **Authentication**: Secure JWT-based authentication with role-based access control (User/Admin).
- **Validation**: Strict schema validation for all inputs (Mongoose).

## 🛠 Tech Stack
- **Core**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Testing**: Jest, Supertest, MongoDB Memory Server
- **DevSecOps**: TruffleHog, Gitleaks, SonarQube, CodeQL, OWASP Dependency-Check, Trivy
- **Containerization**: Docker (Node.js 24 Alpine)

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/2110503-CEDT68/se-project-be-68-2-deemaknisit.git
cd se-project-be-68-2-deemaknisit
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `config/config.env` file in the root directory and add the following:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
```

### 4. Run the Application
**Development Mode:**
```bash
npm run dev
```
**Production Mode:**
```bash
npm start
```

### 5. Run Tests
```bash
npm test
```

## 📖 API Documentation

### 🔐 Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/me` - Get current user profile

### 🏎 Cars
- `GET /api/v1/cars` - List all cars
- `GET /api/v1/cars/:id` - Get car details

### 💬 Reviews
- `GET /api/v1/reviews` - Get all reviews
- `GET /api/v1/cars/:carId/reviews` - Get reviews for a specific car
- `POST /api/v1/cars/:carId/reviews` - Add a review (Authenticated)
- `PUT /api/v1/reviews/:id` - Update a review (Owner/Admin)
- `DELETE /api/v1/reviews/:id` - Delete a review (Owner/Admin)

### 💖 Wishlist
- `GET /api/v1/wishlist` - View your wishlist (Authenticated)
- `POST /api/v1/wishlist` - Add a car to wishlist (Authenticated)
- `DELETE /api/v1/wishlist/:id` - Remove a car from wishlist (Owner)

## 🛡 DevSecOps Pipeline
The project features a state-of-the-art **DevSecOps CI/CD Pipeline** built with GitHub Actions:

1.  **Secret Scanning**: `TruffleHog` and `Gitleaks` scan for exposed credentials.
2.  **SAST**: `CodeQL` and `SonarQube` analyze code for security vulnerabilities.
3.  **SCA**: `OWASP Dependency-Check` scans for vulnerable third-party libraries.
4.  **Container Security**: `Trivy` scans the Docker image for OS-level vulnerabilities.
5.  **Automated CD**: Success on the `main` branch triggers an automated build and push to Docker Hub.

## 🧪 Testing & Coverage
This project maintains **100% code coverage** for all core controllers and models.

### Coverage Report Summary
- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%

## 🐳 Docker Deployment
The backend is containerized for consistent deployment.

### Build and Run
```bash
docker build -t car-rental-be .
docker run -p 5000:5000 car-rental-be
```

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.