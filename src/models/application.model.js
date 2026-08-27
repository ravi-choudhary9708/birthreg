import mongoose from "mongoose";

const childSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    dateOfBirth: {
        type: Date,
        required: true,
    },
    gender: {
        type: String,
        required: true,
        enum: ["Male", "Female", "Other"],
    },
    placeOfBirth: {
        type: String,
        required: true,
        enum: ["Hospital", "Home", "Other"],
    },
    birthPlaceAddress: {
        plotNumber: {
            type: String,
        },
        village: {
            type: String,
            required: true,
        },
        wardNumber: {
            type: String,
        },
        subDistrict: {
            type: String,
            required: true,
        },
        district: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        pinCode: {
            type: String,
            required: true,
        }
    }
}, { _id: false });

const parentSchema = new mongoose.Schema({
    mother: {
        name: {
            type: String,
            required: true,
        },
        adharNumber: {
            type: String,
        },
        mobileNumber: {
            type: String,
            required: true,
        },
        email: {
            type: String
        }
    },
    father: {
        name: {
            type: String,
            required: true,
        },
        adharNumber: {
            type: String,
        },
        mobileNumber: {
            type: String,
            required: true,
        },
        email: {
            type: String
        }
    },
    address: {
        plotNumber: {
            type: String,
        },
        village: {
            type: String,
            required: true,
        },
        wardNumber: {
            type: String,
        },
        subDistrict: {
            type: String,
            required: true,
        },
        district: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        pinCode: {
            type: String,
            required: true,
        }
    },
    permanentAddress: {
        plotNumber: {
            type: String,
        },
        village: {
            type: String,
            required: true,
        },
        wardNumber: {
            type: String,
        },
        subDistrict: {
            type: String,
            required: true,
        },
        district: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        pinCode: {
            type: String,
            required: true,
        }
    }
}, { _id: false });

const informationProviderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    adharNumber: {
        type: String,
    },
    mobileNumber: {
        type: String,
        required: true,
    },
    email: {
        type: String
    },
    providedInformation: {
        type: Boolean,
        default: false,
        required: true,
    },
    informaionProviderAddress: {
        plotNumber: {
            type: String,
        },
        village: {
            type: String,
            required: true,
        },
        wardNumber: {
            type: String,
        },
        subDistrict: {
            type: String,
            required: true,
        },
        district: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        pinCode: {
            type: String,
            required: true,
        }
    },
    motherAddress: {
        city: {
            type: String,
            required: true,
        },
        subDistrict: {
            type: String,
            required: true,
        },
        district: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        pinCode: {
            type: String,
            required: true,
        }
    },
    motherReligion: {
        type: String,
        required: true,
    },
    fatherReligion: {
        type: String,
        required: true,
    },
    motherLiteracy: {
        type: String,
    },
    fatherLiteracy: {
        type: String,
    },
    motherProfession: {
        type: String,
    },
    fatherProfession: {
        type: String,
    },
    motherAgeAtMirrage: {
        type: Number,
    },
    motherAgeAtChildBirth: {
        type: Number,
    },
    motherChildNumber: {
        type: Number,
    }
}, { _id: false });

const ApplicationSchema = new mongoose.Schema({
    applicationNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    facility: {
        type: String,
        required: true,
    },
    child: {
        type: childSchema,
        required: true,
    },
    parents: {
        type: parentSchema,
        required: true,
    },
    informationProvider: {
        type: informationProviderSchema,
        required: true,
    },
    status: {
        type: String,
        enum: [
            "PENDING_VERIFIER", 
            "REJECTED_BY_VERIFIER", 
            "PENDING_OPERATOR", 
            "APPLIED_ON_CSC", 
            "REJECTED_BY_OPERATOR", 
            "COMPLETED"
        ],
        default: "PENDING_VERIFIER",
    },
    certificateUrl: {
        type: String,
    }
}, { timestamps: true });

export const Application = mongoose.models.Application || mongoose.model("Application", ApplicationSchema);