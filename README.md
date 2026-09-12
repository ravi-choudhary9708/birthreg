# Birth Certificate Portal

This is a web application for applying and tracking birth certificates.

## Staff Login Credentials

All generated staff accounts use the following default password:
**Password:** `Madhubani@2024`

*(⚠️ Please advise staff to change this default password after their first login)*

### Operator Account (Centralized)
- **Username:** `operator_central`

### Verifier Accounts (Per Facility - 606 Facilities across 21 Blocks)

Every one of the **606 authorized government healthcare facilities** in Madhubani District has a designated verifier account with the default password `Madhubani@2024`.

All verifier usernames follow the convention `verifier_<facility_slug>`. Verifier accounts and credentials are administered internally via the **Operator Central Dashboard**.

#### Key District & Sub-Divisional Facility Credentials:
- **District Hospital Madhubani (District Hospital):** `verifier_district_hospital`
- **SDH Benipatti Madhubani:** `verifier_sdh_benipatti`
- **SDH Jaynagar Madhubani:** `verifier_sdh_jaynagar`
- **SDH Jhanjharpur Madhubani:** `verifier_sdh_jhanjharpur`
- **SDH Phulparas Madhubani:** `verifier_sdh_phulparas`

#### Sample CHC, PHC, & HWC Credentials:
- **CHC ANDHRATHARI:** `verifier_chc_andhrathari`
- **PHC BABUBARHI:** `verifier_phc_babubarhi`
- **CHC BABUBARHI:** `verifier_chc_babubarhi`
- **PRIMARY HEALTH CENTRE BASOPATTI:** `verifier_primary_health_centre_basopatti`
- **CHC BISFI:** `verifier_chc_bisfi`
- **PHC GHOGHARDIHA:** `verifier_phc_ghoghardiha`
- **CHC HARLAKHI:** `verifier_chc_harlakhi`
- **CHC KHAJAULI:** `verifier_chc_khajauli`
- **CHC LADANIA:** `verifier_chc_ladania`
- **CHC LAKHNAUR:** `verifier_chc_lakhnaur`
- **PRIMARY HEALTH CENTRE PANDAUL:** `verifier_primary_health_centre_pandaul`
- **CHC RAHIKA:** `verifier_chc_rahika`
- **CHC RAJNAGAR:** `verifier_chc_rajnagar`
- *(To look up any other facility's exact login ID among the 606, search the `/facilities` directory or Operator Dashboard)*

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

