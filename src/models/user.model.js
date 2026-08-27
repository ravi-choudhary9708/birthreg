import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema= new mongoose.Schema({
    username:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
        unique:true,
    },
    role:{
        type:String,
        required:true,
        enum:["verifier","operator"],
    },
    facility: {
        type: String,
        required: true,
    },
    password:{
        type:String,
        required:[true,"password is required"],
    },
}, { timestamps: true, collection: 'cert_users' });

userSchema.pre("save", async function() {
   if(!this.isModified("password")) return;
   this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect= async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken= function(){
    return jwt.sign(
        {
            _id:this._id,
            role:this.role,
            username:this.username,
            facility:this.facility,
        },
        process.env.JWT_SECRET,
        {
            expiresIn:process.env.JWT_EXPIRES || "1d",
        }
    )
}

export const User= mongoose.models.User || mongoose.model("User",userSchema);
