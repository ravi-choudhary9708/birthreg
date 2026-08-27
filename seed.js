require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const VERIFIER_ACCOUNTS = [
  { username: "verifier_sadar", facility: "Sadar Hospital Madhubani" },
  { username: "verifier_pandaul", facility: "PHC Pandaul" },
  { username: "verifier_kaluahi", facility: "PHC Kaluahi" },
  { username: "verifier_babubarhi", facility: "PHC Babubarhi" },
  { username: "verifier_jhanjharpur", facility: "PHC Jhanjharpur" },
  { username: "verifier_khajauli", facility: "PHC Khajauli" },
  { username: "verifier_benipatti", facility: "PHC Benipatti" },
  { username: "verifier_madhwapur", facility: "PHC Madhwapur" },
  { username: "verifier_madhepur", facility: "PHC Madhepur" },
  { username: "verifier_ladaniya", facility: "CHC Ladaniya" },
  { username: "verifier_jaynagar", facility: "CHC Jaynagar" },
  { username: "verifier_khutauna", facility: "CHC Khutauna" },
  { username: "verifier_bisffi", facility: "CHC Bisffi" },
  { username: "verifier_ghoghardiha", facility: "CHC Ghoghardiha" },
  { username: "verifier_phulparas", facility: "CHC Phulparas" },
  { username: "verifier_rajnagar", facility: "CHC Rajnagar" },
  { username: "verifier_basopatti", facility: "CHC Basopatti" },
  { username: "verifier_andhrarthari", facility: "CHC Andhrarthari" },
  { username: "verifier_harlakhi", facility: "CHC Harlakhi" },
  { username: "verifier_laukahi", facility: "CHC Laukahi" },
  { username: "verifier_rahika", facility: "CHC Rahika" },
  { username: "verifier_sdh_benipatti", facility: "Sub-Divisional Hospital Benipatti" },
  { username: "verifier_sdh_jhanjharpur", facility: "Sub-Divisional Hospital Jhanjharpur" },
  { username: "verifier_sdh_phulparas", facility: "Sub-Divisional Hospital Phulparas" },
  { username: "verifier_rh_madhepur", facility: "Referral Hospital Madhepur" },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Define a simple schema just for seeding so we don't rely on the Next.js one
        const userSchema = new mongoose.Schema({
            username: { type: String, required: true },
            role: { type: String, required: true },
            facility: { type: String, required: true },
            password: { type: String, required: true }
        }, { collection: 'cert_users' });
        
        // Fix for "next is not a function" in plain mongoose
        userSchema.pre("save", async function() {
           if(this.isModified("password")) {
               this.password = await bcrypt.hash(this.password, 10);
           }
        });

        const User = mongoose.models.User || mongoose.model("User", userSchema);
        
        const operatorExists = await User.findOne({ username: "operator_central" });
        if (operatorExists) {
            console.log("Users already seeded. Skipping seed.");
            process.exit(0);
        }

        const defaultPassword = "Madhubani@2024";
        
        for (const v of VERIFIER_ACCOUNTS) {
            await User.create({ ...v, password: defaultPassword, role: "verifier" });
        }

        await User.create({
            username: "operator_central",
            password: defaultPassword,
            role: "operator",
            facility: "Central Operator",
        });
        
        console.log("✅ Seeded successfully!");
        process.exit(0);
    } catch (e) {
        console.error("Seed error:", e);
        process.exit(1);
    }
}

seed();
