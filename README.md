# Birth Certificate Portal

This is a web application for applying and tracking birth certificates.

## Staff Login Credentials

All generated staff accounts use the following default password:
**Password:** `Madhubani@2024`

*(⚠️ Please advise staff to change this default password after their first login)*

### Operator Account (Centralized)
- **Username:** `operator_central`

### Verifier Accounts (Per Facility - 39 Facilities)
- **REFERRAL HOSPITAL ANDHRATHARI:** `verifier_rh_andhrathari`
- **PHC ANDHRATHADHI:** `verifier_phc_andhrathadhi`
- **PHC BABUBARHI:** `verifier_phc_babubarhi`
- **CHC BABUBARHI:** `verifier_chc_babubarhi`
- **PRIMARY HEALTH CENTRE BASOPATTI:** `verifier_phc_basopatti`
- **PHC BENIPATTI MADHUBANI:** `verifier_phc_benipatti`
- **PRIMARI HEALTH CENTRE BISFI:** `verifier_phc_bisfi`
- **CHC BISFI:** `verifier_chc_bisfi`
- **PHC GHOGHARDIHA:** `verifier_phc_ghoghardiha`
- **PHC HARLAKHI:** `verifier_phc_harlakhi`
- **CHC HARLAKHI:** `verifier_chc_harlakhi`
- **SUB DIVISIONAL HOSPITAL, JAYNAGAR:** `verifier_sdh_jaynagar`
- **PRIMARY HEALTH CENTRE JAYNAGAR:** `verifier_phc_jaynagar`
- **SUPRITENDENT SUB DIVISIONAL HOSPITAL JHANJHARPUR:** `verifier_sdh_jhanjharpur`
- **PRIMARY HEALTH CENTRE JHANJHARPUR:** `verifier_phc_jhanjharpur`
- **PHC KALUAHI:** `verifier_phc_kaluahi`
- **CHC KALUAHI:** `verifier_chc_kaluahi`
- **PRIMARY HEALTH CENTRE KHAJAULI:** `verifier_phc_khajauli`
- **CHC KHAJAULI:** `verifier_chc_khajauli`
- **PHC KHUTAUNA:** `verifier_phc_khutauna`
- **CHC KHUTAUNA:** `verifier_chc_khutauna`
- **PRIMARY HEALTH CENTRE LADANIA:** `verifier_phc_ladania`
- **CHC LADANIA:** `verifier_chc_ladania`
- **PRIMARY HEALTH CENTRE LAKHNAUR:** `verifier_phc_lakhnaur`
- **CHC LAKHNAUR:** `verifier_chc_lakhnaur`
- **PHC LAUKAHI MADHUBANI:** `verifier_phc_laukahi`
- **CHC LAUKAHI:** `verifier_chc_laukahi`
- **PRIMARY HEALTH CENTRE MADHEPUR:** `verifier_phc_madhepur`
- **SADAR HOSPITAL MADHUBANI:** `verifier_sadar`
- **PRIMARY HEALTH CENTRE MADHWAPUR:** `verifier_phc_madhwapur`
- **CHC MADHWAPUR:** `verifier_chc_madhwapur`
- **APHC MAHRAIL:** `verifier_aphc_mahrail`
- **PRIMARY HEALTH CENTRE PANDAUL:** `verifier_phc_pandaul`
- **SUPRITENDENT SUB DIVISIONAL HOSPITAL PHULPARAS:** `verifier_sdh_phulparas`
- **PRIMARY HEALTH CENTRE PHULPARAS:** `verifier_phc_phulparas`
- **PRIMARY HEALTH CENTER RAHIKA:** `verifier_phc_rahika`
- **CHC RAHIKA:** `verifier_chc_rahika`
- **PRIMARY HEALTH CENTRE RAJNAGAR:** `verifier_phc_rajnagar`
- **CHC RAJNAGAR:** `verifier_chc_rajnagar`

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

