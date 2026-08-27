# Birth Certificate Portal

This is a web application for applying and tracking birth certificates.

## Staff Login Credentials

All generated staff accounts use the following default password:
**Password:** `Madhubani@2024`

*(⚠️ Please advise staff to change this default password after their first login)*

### Operator Account (Centralized)
- **Username:** `operator_central`

### Verifier Accounts (Per Facility)
- **Sadar Hospital Madhubani:** `verifier_sadar`
- **PHC Pandaul:** `verifier_pandaul`
- **PHC Kaluahi:** `verifier_kaluahi`
- **PHC Babubarhi:** `verifier_babubarhi`
- **PHC Jhanjharpur:** `verifier_jhanjharpur`
- **PHC Khajauli:** `verifier_khajauli`
- **PHC Benipatti:** `verifier_benipatti`
- **PHC Madhwapur:** `verifier_madhwapur`
- **PHC Madhepur:** `verifier_madhepur`
- **CHC Ladaniya:** `verifier_ladaniya`
- **CHC Jaynagar:** `verifier_jaynagar`
- **CHC Khutauna:** `verifier_khutauna`
- **CHC Bisffi:** `verifier_bisffi`
- **CHC Ghoghardiha:** `verifier_ghoghardiha`
- **CHC Phulparas:** `verifier_phulparas`
- **CHC Rajnagar:** `verifier_rajnagar`
- **CHC Basopatti:** `verifier_basopatti`
- **CHC Andhrarthari:** `verifier_andhrarthari`
- **CHC Harlakhi:** `verifier_harlakhi`
- **CHC Laukahi:** `verifier_laukahi`
- **CHC Rahika:** `verifier_rahika`
- **Sub-Divisional Hospital Benipatti:** `verifier_sdh_benipatti`
- **Sub-Divisional Hospital Jhanjharpur:** `verifier_sdh_jhanjharpur`
- **Sub-Divisional Hospital Phulparas:** `verifier_sdh_phulparas`
- **Referral Hospital Madhepur:** `verifier_rh_madhepur`

## Environment Setup
Make sure to configure `.env.local` before starting the application:
```env
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
NEXT_PUBLIC_BASE_URL=
```

## Running the Application
```bash
npm install
npm run dev -p 8080
```
