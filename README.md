# Mandai E-commerce Webapp

## Description

Mandai Wildlife Store is a modern e-commerce web application built as a monorepo. It features a NestJS backend with MikroORM and PostgreSQL (via Supabase), and a React frontend with Vite, Tailwind CSS, and Flowbite. The app supports user authentication, product management, shopping carts, and order processing, with both storefront and admin interfaces.

## Features

- User registration and JWT-based authentication
- Product catalog with categories and images
- Shopping cart functionality
- Order management and checkout
- Admin dashboard for managing users, products, and orders
- Responsive design with Tailwind CSS

## Prerequisites

- Node.js (v18 or later)
- npm
- Postgres database (either with Supabase, PlanetScale, or self-hosted)

## Installation

1. Clone the repository:

   ```bash
   git clone <repo-url>
   cd mandai-webapp
   ```

2. Install dependencies for each package:

   ```bash
   cd shared && npm install && cd ..
   cd api && npm install && cd ..
   cd web && npm install && cd ..
   ```

3. Set up the database:

   - Create your Postgres database.
   - Copy `.env.example` from `api/` to `api/.env` and fill in your database credentials (database URL, JWT secrets).
   - Run migrations: `cd api && npx mikro-orm migration:up`
   - You can use database.sql to manually insert the tables into your database.

## Running the Application

1. Build the shared package:

   ```bash
   cd shared && npm run build
   ```

2. Start the API server:

   ```bash
   cd api && npm run start:dev
   ```

3. Start the web server:

   ```bash
   cd web && npm run dev
   ```

4. To run tests:
   ```bash
   # All tests
   ./run-tests.sh

   # Individual suites
   cd api && npm test
   cd ../web && npm run test:run

   # Watch mode
   cd web && npm run test
   ```

The frontend will be available at `http://localhost:5173` (Vite default), and the API at `http://localhost:3000`.

## Directory Structure

```
/mandai-webapp
├── api/                 # NestJS backend
│   ├── src/
│   │   ├── auth/        # Authentication module
│   │   ├── users/       # User management
│   │   ├── products/    # Product CRUD
│   │   ├── carts/       # Shopping cart
│   │   ├── orders/      # Order processing
│   │   ├── common/      # Shared utilities
│   │   └── config/      # Configuration
│   ├── migrations/      # Database migrations
│   └── test/            # Tests
├── web/                 # React frontend
│   └── src/
│       ├── features/    # Feature modules (auth, products, cart, orders)
│       ├── layouts/     # AdminLayout, StorefrontLayout
│       ├── routes/      # Route definitions with auth protection
│       ├── components/  # Reusable UI components
│       ├── lib/         # API client, query client, utilities
│       └── styles/      # Tailwind configuration
├── shared/              # Shared TypeScript types, DTOs, and constants
└── docs/                # Documentation
├── database.sql         # database tables to be used
```

## Testing

The project includes unit and integration tests for both the API and frontend. See [TESTING_GUIDE.md](docs/TESTING_GUIDE.md) for detailed test recommendations and examples.

### Running Tests

#### API Tests (Jest)
```bash
cd api && npm test
```

#### Frontend Tests (Vitest)
```bash
cd web && npm run test:run
```

#### Run All Tests
```bash
cd api && npm test && cd ../web && npm run test:run
```

### Test Coverage
- API: Jest with unit tests for controllers and services
- Web: Vitest with React Testing Library for component testing

### Example Tests Added
- `AdminProductList` component test (Web)
- `AuthController` test (API)
- `ProductsService` test (API)
- `LogoutButton` component test (Web)

## Scripts

### API

- `npm run build` - Build TypeScript to dist/
- `npm run lint` - Run ESLint with Prettier
- `npm run test` - Run Jest unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run start:dev` - Start development server with watch mode

### Web

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run test` - Run Vitest in watch mode
- `npm run test:run` - Run Vitest once
- `npm run test:ui` - Run Vitest with UI

### Shared

- `npm run build` - Build TypeScript declarations
