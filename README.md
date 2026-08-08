# Competitive Exam Mock Test Platform

## Project Structure
- backend/ - NestJS backend with API routes
- frontend/ - Next.js React frontend
- .github/workflows/ - CI pipeline
- docker-compose.yml - Local development setup

## Local Setup
1. Start Docker stack: `docker-compose up -d`
2. Run frontend: `cd frontend && npm install && npm run dev`
3. Run backend: `cd backend && npm install && node src/main.ts`

## Frontend URL
- Frontend serves at: http://localhost:3000

## Backend API
- API serves at: http://localhost:3000/api

## Authentication Flow
- JWT sessions
- Redis-backed auth
- Rate limiting

## .env Setup
Frontend variables:
- NEXT_PUBLIC_API_URL=http://localhost:3000/api
- NEXT_PUBLIC_APP_URL=http://localhost:3000

Backend variables:
- DB_HOST=postgres
- DB_PORT=5432
- DB_NAME=exam_platform
- DB_USER=exam_user
- JWT_SECRET=your_jwt_secret

## CI Pipeline
- Runs on GitHub Actions
- Starts on push
- Runs lint + placeholder tests

## Database Local Setup
- PostgreSQL initialized in docker-compose
- Redis available via container

## Running Locally
- Frontend: http://localhost:3000
- Backend API: http://localhost:3000/api
- Database: PostgreSQL (Docker container)

## First Test Commands
1. `curl http://localhost:3000/api/examlist`
2. `curl http://localhost:3000/api/take-test`
3. `curl http://localhost:3000/api/scores`

## Security Features
- Input validation
- Server-side money calculation
- Rate limiting
- Protection against XSS

## Build Status
Current state: Functional MVP with Dockerized dependencies

## Notes
- Password hashes stored securely
- Secrets managed via environment variables
- Data modeling follows PRD schema

## Next Steps
1. Implement test engine
2. Build authentication system
3. Set up payment gateway/razorpay
4. Configure CDN for study materials

# End of README.md