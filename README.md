# Platform API

Multi-tenant REST API built with Express 5, TypeScript, and Prisma. Supports company-based workspaces with role-based access control (RBAC), request management, time tracking, and real-time notifications.

## Features

- **Multi-tenant Architecture**: Companies with isolated workspaces
- **Authentication & Authorization**: JWT with access/refresh tokens and httpOnly cookies
- **Role-Based Access Control**: Global and per-company permissions
- **Membership Management**: Invitations with custom roles per company
- **Company Requests**: Request/review flow for company creation
- **Permission Requests**: Request/review flow for global permissions
- **Time Tracking**: Time entries with projects, clients, categories, and rate rules
- **Clients & Sites**: Client management with sites and per-resource rate rules
- **Calendar Notes**: Notes assigned to dates and users
- **Real-Time Notifications**: Server-Sent Events (SSE)
- **Security**: Password hashing, token revocation, soft deletes, Helmet

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express 5
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Validation**: Zod
- **Logging**: Winston + Morgan
- **Security**: Helmet, CORS, cookie-parser

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

3. Copy `.env.example` to `.env` and configure the variables:
   ```bash
   cp .env.example .env
   ```

4. Start PostgreSQL (with Docker):
   ```bash
   docker-compose up -d
   ```

5. Reset the database and run the seed:
   ```bash
   npm run db:rebuild
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Development server with hot reload (tsx watch) |
| `npm run build` | Compile for production (tsc + tsc-alias) |
| `npm start` | Start production server |
| `npm run db:rebuild` | Reset database and run seed |

## API Endpoints

All endpoints are prefixed with `/api`.

### Authentication — `/api/auth`
| Method | Route | Description |
|---|---|---|
| POST | `/register` | Register a new user |
| POST | `/login` | Log in |
| POST | `/refresh` | Renew access token |
| POST | `/logout` | Log out and revoke token |
| GET | `/me` | Get current user profile |

### Users — `/api/users`
| Method | Route | Description |
|---|---|---|
| GET | `/` | List users |
| GET | `/:id` | Get user by ID |
| PATCH | `/:id` | Update user |
| PATCH | `/:id/password` | Change password |
| DELETE | `/:id` | Disable user |

### Companies — `/api/companies`
| Method | Route | Description |
|---|---|---|
| POST | `/` | Create company (requires `COMPANY:CREATE` permission) |
| GET | `/` | List companies |
| GET | `/slug/:slug` | Get company by slug |
| GET | `/:id` | Get company by ID |
| PATCH | `/:id` | Update company |
| DELETE | `/:id` | Delete company (soft delete) |
| POST | `/:id/restore` | Restore deleted company |

### Memberships — `/api/companies/:id/...`
| Method | Route | Description |
|---|---|---|
| GET | `/non-members` | Users who are not members |
| GET | `/members` | List company members |
| POST | `/members/invite` | Invite a member |
| PATCH | `/members/:memberId/roles` | Update member roles |
| DELETE | `/members/:memberId` | Remove member |
| GET | `/roles` | List company roles |
| POST | `/roles` | Create role |
| PATCH | `/roles/:roleId` | Update role |
| DELETE | `/roles/:roleId` | Delete role |

### Invitations — `/api/invitations`
| Method | Route | Description |
|---|---|---|
| GET | `/` | View pending invitations |
| POST | `/:membershipId/accept` | Accept invitation |
| POST | `/:membershipId/decline` | Decline invitation |

### Company Requests — `/api/company-requests`
| Method | Route | Description |
|---|---|---|
| POST | `/` | Create request |
| GET | `/` | View my requests |
| GET | `/:id` | Get request by ID |
| PATCH | `/:id` | Update request |
| POST | `/:id/cancel` | Cancel request |
| GET | `/admin` | (Admin) List all requests |
| POST | `/admin/:id/review` | (Admin) Review request |

### Permission Requests — `/api/permission-requests`
| Method | Route | Description |
|---|---|---|
| GET | `/available-permissions` | Available permissions to request |
| POST | `/` | Create request |
| GET | `/` | View my requests |
| GET | `/:id` | Get request by ID |
| PATCH | `/:id` | Update request |
| POST | `/:id/cancel` | Cancel request |
| GET | `/admin/all` | (Admin) List all requests |
| POST | `/admin/:id/review` | (Admin) Review request |

### Permissions — `/api/permissions` *(Platform Admin only)*
| Method | Route | Description |
|---|---|---|
| GET | `/` | List permissions (paginated) |
| GET | `/all` | List all permissions |
| GET | `/:id` | Get permission by ID |
| PATCH | `/:id` | Update description |

### Time Tracking — `/api/time-entries`
| Method | Route | Description |
|---|---|---|
| POST | `/` | Create time entry |
| GET | `/` | List entries |
| GET | `/summary` | Time summary |
| GET | `/:id` | Get entry by ID |
| PATCH | `/:id` | Update entry |
| DELETE | `/:id` | Delete entry |

### Projects — `/api/projects`
| Method | Route | Description |
|---|---|---|
| POST | `/` | Create project |
| GET | `/` | List projects |
| GET | `/:id` | Get project by ID |
| PATCH | `/:id` | Update project |
| DELETE | `/:id` | Delete project |

### Clients — `/api/clients`
| Method | Route | Description |
|---|---|---|
| GET | `/` | List clients |
| POST | `/` | Create client |
| GET | `/:id` | Get client by ID |
| PATCH | `/:id` | Update client |
| DELETE | `/:id` | Delete client |
| POST | `/:clientId/sites` | Create site |
| PATCH | `/sites/:siteId` | Update site |
| DELETE | `/sites/:siteId` | Delete site |
| POST | `/:clientId/rates` | Create rate rule |
| PATCH | `/rates/:ruleId` | Update rate rule |
| DELETE | `/rates/:ruleId` | Delete rate rule |

### Time Entry Categories — `/api/time-entry-categories`
| Method | Route | Description |
|---|---|---|
| GET | `/` | List categories |
| POST | `/` | Create category |
| PATCH | `/:id` | Update category |
| DELETE | `/:id` | Delete category |

### Calendar Notes — `/api/calendar-notes`
| Method | Route | Description |
|---|---|---|
| GET | `/upcoming-reminders` | Get upcoming reminder count |
| POST | `/dismiss-reminders` | Dismiss reminders |
| POST | `/` | Create note |
| GET | `/` | List notes |
| GET | `/:id` | Get note by ID |
| PATCH | `/:id` | Update note |
| DELETE | `/:id` | Delete note |

### Push Notifications — `/api/push`
| Method | Route | Description |
|---|---|---|
| GET | `/vapid-public-key` | Get VAPID public key (public) |
| POST | `/subscribe` | Subscribe to push notifications |
| POST | `/unsubscribe` | Unsubscribe |
| GET | `/subscriptions/me` | List my subscriptions |
| POST | `/test` | Send test notification to self |
| GET | `/subscriptions` | (Admin) List all subscriptions |
| POST | `/test/:userId` | (Admin) Test notification to user |

### SSE — `/api/sse`
| Method | Route | Description |
|---|---|---|
| GET | `/` | Establish SSE connection (token via query param) |

### Health Check
| Method | Route | Description |
|---|---|---|
| GET | `/health` | Service health status |

## Project Structure

```
src/
├── app.ts              # Express app configuration
├── main.ts             # Server bootstrap
├── routes.ts           # Central route registry
├── common/             # Shared utilities
│   ├── constants/      # Global constants
│   ├── errors/         # Error handling
│   ├── logger/         # Winston logger
│   ├── middlewares/    # Auth, permissions, validation
│   ├── services/       # SSE Manager
│   └── utils/          # JWT, tokens, async handler
├── config/             # Environment configuration
├── db/                 # Prisma client
└── modules/
    ├── auth/                    # Authentication
    ├── users/                   # User management
    ├── companies/               # Company management
    ├── memberships/             # Memberships & invitations
    ├── company-requests/        # Company requests
    ├── permission-requests/     # Permission requests
    ├── permissions/             # Permissions (admin)
    ├── time-tracker/            # Time entries & projects
    ├── clients/                 # Clients, sites & rates
    ├── time-entry-categories/   # Time entry categories
    ├── calendar-notes/          # Calendar notes
    └── sse/                     # Server-Sent Events
```

## Database Schema

- **User / PlatformAdmin**: Global user accounts with email verification and admin flag
- **Company**: Multi-tenant workspaces with soft delete and status management
- **Membership**: User-company relationship with hierarchical roles
- **Role / Permission**: RBAC system with global and per-company permissions
- **CompanyInvite / CompanyMemberInvite**: Invitation flows
- **CompanyRequest / PermissionRequest**: Request flows with review process
- **RefreshToken**: Refresh token management
- **TimeEntry / Project**: Time tracking with overtime and contract type support
- **Client / Site / RateRule**: Clients with sites and per-resource rate rules
- **TimeEntryCategory**: Categories for time entries
- **CalendarNote / CalendarNoteAssignee**: Calendar notes with assignees

## Environment Variables

See [`.env.example`](.env.example) for required configuration.
