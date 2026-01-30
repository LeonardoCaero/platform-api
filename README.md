# Platform API

A multi-tenant SaaS platform API built with Express, TypeScript, and Prisma. Supports company-based workspaces with role-based access control (RBAC) and invitation management.

## Features

- **Multi-tenant Architecture**: Companies with isolated workspaces
- **Authentication & Authorization**: JWT-based auth with refresh tokens
- **Role-Based Access Control**: Granular permissions system per company
- **Invitation System**: Platform admins can invite companies, company members can invite users
- **User Management**: Email verification, profile management, hierarchical supervision
- **Audit & Security**: Password hashing, token revocation, soft deletes

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **Validation**: Zod schemas
- **Logging**: Winston

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 16+
- Docker (optional)

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

4. Start PostgreSQL (using Docker):
   ```bash
   docker-compose up -d
   ```

5. Run database migrations and seed:
   ```bash
   npm run db:rebuild
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:4000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:rebuild` - Reset database and run seed

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and revoke token
- `GET /api/auth/me` - Get current user profile

### Health Check
- `GET /health` - Service health status

## Project Structure

```
src/
├── app.ts              # Express app configuration
├── main.ts             # Server bootstrap
├── routes.ts           # Main route registry
├── common/             # Shared utilities
│   ├── errors/         # Error handling
│   ├── logger/         # Winston logger
│   ├── middlewares/    # Auth & validation
│   └── utils/          # Helpers (JWT, tokens, async)
├── config/             # Environment configuration
├── db/                 # Prisma client
└── modules/
    └── auth/           # Authentication module
        ├── controllers/
        ├── services/
        ├── schemas/
        └── routes/
```

## Database Schema

- **Users**: Global user accounts with email verification
- **Companies**: Tenant workspaces with status management
- **Memberships**: User-Company relationships with roles
- **Roles & Permissions**: Fine-grained RBAC system
- **Invites**: Company creation and member invitation flows
- **Tokens**: Refresh token management

## Environment Variables

See [`.env.example`](.env.example) for required configuration.
