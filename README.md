# Birth Certificate Portal

This is a web application for applying and tracking birth certificates.

## Staff Roles & Access

Staff access (Operator and Healthcare Facility Verifiers) is managed securely through role-based access control:

- **Central Operator:** Oversees district-wide applications, SLA compliance, and facility verifier administration.
- **Facility Verifiers:** Designated medical officers and staff across authorized healthcare facilities responsible for reviewing and verifying birth certificate applications.

Accounts and access credentials are created and managed securely via the administrative portal.

## Environment Setup
Make sure to configure `.env.local` before starting the application:
```env
# PostgreSQL Database (Bihar SDC / Local)
DATABASE_URL="postgresql://<username>:<password>@<sdc_host_or_localhost>:5432/<dbname>?schema=public&sslmode=prefer"

# Authentication & Security
JWT_SECRET=
JWT_EXPIRES=1d

# Storage & Notifications
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
NEXT_PUBLIC_BASE_URL=
```

## Database Migration & Seeding (PostgreSQL)

1. Apply migrations to PostgreSQL:
```bash
npx prisma migrate deploy
# Or for direct SQL execution on Bihar SDC servers:
# psql -d <dbname> -f prisma/migrations/0_init/migration.sql
```

2. Seed staff accounts into PostgreSQL:
```bash
node seed.js
# Or navigate to: http://localhost:3000/api/setup
```

## Running the Application
```bash
npm install
npm run dev -p 8080
```

