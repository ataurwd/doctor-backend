# Dr. Md. Kamrul Hasan Sajib – Backend API & Database

Node.js, Express, and MongoDB backend for **Dr. Md. Kamrul Hasan Sajib** Rheumatology website.

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Security:** Helmet, CORS protection, custom API shield guard, rate limiting, NoSQL injection sanitization, JWT authentication

## API Capabilities
- **Public Bootstrap API:** Provides doctor credentials, chambers, specialities, services, patient education articles, and metadata in both Bengali and English.
- **Admin Management:** Secure JWT-authenticated endpoints for managing chambers, posts, specialities, inquiries, and settings.
- **Appointment / Contact Inquiries:** Secure inquiry submission and storage.
- **Database Seeder:** Comprehensive data migration script (`src/seed/runSeed.js`).

## Getting Started

1. Clone repository:
   ```bash
   git clone https://github.com/ataurwd/doctor-backend.git
   cd doctor-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   # Update MONGODB_URI and JWT_SECRET with your values
   ```

4. Seed database (optional/initial setup):
   ```bash
   npm run seed
   ```

5. Run server:
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```
   Server listens on [http://localhost:5000](http://localhost:5000).

