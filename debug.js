require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const users = await User.find({}).limit(5);
    console.log("First 5 users:");
    users.forEach(u => console.log(u.username, u.role, u.facility));
    
    const operator = await User.findOne({ username: 'operator_central' });
    console.log("operator_central exists?", !!operator);
    
    process.exit(0);
}
run();
