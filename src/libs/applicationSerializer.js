/**
 * Converts a relational PostgreSQL application (with joined relations)
 * into the structured JSON object expected by the frontend UI.
 */
export function serializeApplication(app) {
    if (!app) return null;

    const child = app.child ? {
        name: app.child.name,
        dateOfBirth: app.child.dateOfBirth,
        gender: app.child.gender,
        adharNumber: app.child.adharNumber || undefined,
        adharCardUrl: app.child.adharCardUrl || undefined,
        weight: app.child.weight ?? undefined,
        deliveryAttention: app.child.deliveryAttention || undefined,
        deliveryMethod: app.child.deliveryMethod || undefined,
        pregnancyDuration: app.child.pregnancyDuration ?? undefined,
        placeOfBirth: app.child.placeOfBirth,
        birthPlaceAddress: {
            plotNumber: app.child.birthPlotNumber || "",
            mohalla: app.child.birthMohalla || "",
            village: app.child.birthVillage,
            wardNumber: app.child.birthWardNumber || "",
            subDistrict: app.child.birthSubDistrict,
            block: app.child.birthBlock || "",
            district: app.child.birthDistrict,
            state: app.child.birthState,
            pinCode: app.child.birthPinCode,
            postOffice: app.child.birthPostOffice || "",
        }
    } : undefined;

    const parents = app.parents ? {
        mother: {
            name: app.parents.motherName,
            adharNumber: app.parents.motherAdhar,
            adharCardUrl: app.parents.motherAdharCardUrl || undefined,
            mobileNumber: app.parents.motherMobile,
            email: app.parents.motherEmail || "",
        },
        father: {
            name: app.parents.fatherName,
            adharNumber: app.parents.fatherAdhar,
            adharCardUrl: app.parents.fatherAdharCardUrl || undefined,
            mobileNumber: app.parents.fatherMobile,
            email: app.parents.fatherEmail || "",
        },
        address: {
            plotNumber: app.parents.presentPlotNumber || "",
            mohalla: app.parents.presentMohalla || "",
            village: app.parents.presentVillage,
            wardNumber: app.parents.presentWardNumber || "",
            subDistrict: app.parents.presentSubDistrict,
            block: app.parents.presentBlock || "",
            district: app.parents.presentDistrict,
            state: app.parents.presentState,
            pinCode: app.parents.presentPinCode,
            postOffice: app.parents.presentPostOffice || "",
        },
        permanentAddress: {
            plotNumber: app.parents.permPlotNumber || "",
            mohalla: app.parents.permMohalla || "",
            village: app.parents.permVillage,
            wardNumber: app.parents.permWardNumber || "",
            subDistrict: app.parents.permSubDistrict,
            block: app.parents.permBlock || "",
            district: app.parents.permDistrict,
            state: app.parents.permState,
            pinCode: app.parents.permPinCode,
            postOffice: app.parents.permPostOffice || "",
        }
    } : undefined;

    const informationProvider = app.informant ? {
        name: app.informant.name,
        adharNumber: app.informant.adharNumber || "",
        adharCardUrl: app.informant.adharCardUrl || undefined,
        mobileNumber: app.informant.mobileNumber,
        email: app.informant.email || "",
        providedInformation: app.informant.providedInformation,
        informaionProviderAddress: {
            plotNumber: app.informant.informantPlotNumber || "",
            village: app.informant.informantVillage,
            wardNumber: app.informant.informantWardNumber || "",
            subDistrict: app.informant.informantSubDistrict,
            block: app.informant.informantBlock || "",
            district: app.informant.informantDistrict,
            state: app.informant.informantState,
            pinCode: app.informant.informantPinCode,
            postOffice: app.informant.informantPostOffice || "",
        },
        motherAddress: {
            city: app.informant.motherCity,
            subDistrict: app.informant.motherSubDistrict,
            block: app.informant.motherBlock || "",
            district: app.informant.motherDistrict,
            state: app.informant.motherState,
            pinCode: app.informant.motherPinCode,
            postOffice: app.informant.motherPostOffice || "",
        },
        motherReligion: app.informant.motherReligion,
        fatherReligion: app.informant.fatherReligion,
        motherLiteracy: app.informant.motherLiteracy || "",
        fatherLiteracy: app.informant.fatherLiteracy || "",
        motherProfession: app.informant.motherProfession || "",
        fatherProfession: app.informant.fatherProfession || "",
        motherAgeAtMirrage: app.informant.motherAgeAtMirrage ?? undefined,
        motherAgeAtChildBirth: app.informant.motherAgeAtChildBirth ?? undefined,
        motherChildNumber: app.informant.motherChildNumber ?? undefined,
        relationToChild: app.informant.relationToChild || "",
        declarationAccepted: app.informant.declarationAccepted,
    } : undefined;

    return {
        _id: app.id,
        id: app.id,
        applicationNumber: app.applicationNumber,
        facility: app.facility,
        status: app.status,
        certificateUrl: app.certificateUrl,
        remarks: app.remarks,
        child,
        parents,
        informationProvider,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
    };
}

/**
 * Transforms incoming form submission JSON into Prisma nested create query object.
 */
export function formatPrismaApplicationCreate(data) {
    const { applicationNumber, facility, child, parents, informationProvider } = data;

    return {
        applicationNumber,
        facility,
        status: "PENDING_VERIFIER",
        child: {
            create: {
                name: child.name,
                dateOfBirth: new Date(child.dateOfBirth),
                gender: child.gender,
                adharNumber: child.adharNumber || null,
                adharCardUrl: child.adharCardUrl || null,
                weight: child.weight ? parseFloat(child.weight) : null,
                deliveryAttention: child.deliveryAttention || null,
                deliveryMethod: child.deliveryMethod || null,
                pregnancyDuration: child.pregnancyDuration ? parseInt(child.pregnancyDuration, 10) : null,
                placeOfBirth: child.placeOfBirth,
                birthPlotNumber: child.birthPlaceAddress?.plotNumber || null,
                birthMohalla: child.birthPlaceAddress?.mohalla || null,
                birthVillage: child.birthPlaceAddress?.village || "",
                birthWardNumber: child.birthPlaceAddress?.wardNumber || null,
                birthSubDistrict: child.birthPlaceAddress?.subDistrict || "",
                birthBlock: child.birthPlaceAddress?.block || null,
                birthDistrict: child.birthPlaceAddress?.district || "",
                birthState: child.birthPlaceAddress?.state || "",
                birthPinCode: child.birthPlaceAddress?.pinCode || "",
                birthPostOffice: child.birthPlaceAddress?.postOffice || null,
            }
        },
        parents: {
            create: {
                motherName: parents.mother?.name || "",
                motherAdhar: parents.mother?.adharNumber || "",
                motherAdharCardUrl: parents.mother?.adharCardUrl || null,
                motherMobile: parents.mother?.mobileNumber || "",
                motherEmail: parents.mother?.email || null,
                fatherName: parents.father?.name || "",
                fatherAdhar: parents.father?.adharNumber || "",
                fatherAdharCardUrl: parents.father?.adharCardUrl || null,
                fatherMobile: parents.father?.mobileNumber || "",
                fatherEmail: parents.father?.email || null,

                presentPlotNumber: parents.address?.plotNumber || null,
                presentMohalla: parents.address?.mohalla || null,
                presentVillage: parents.address?.village || "",
                presentWardNumber: parents.address?.wardNumber || null,
                presentSubDistrict: parents.address?.subDistrict || "",
                presentBlock: parents.address?.block || null,
                presentDistrict: parents.address?.district || "",
                presentState: parents.address?.state || "",
                presentPinCode: parents.address?.pinCode || "",
                presentPostOffice: parents.address?.postOffice || null,

                permPlotNumber: parents.permanentAddress?.plotNumber || null,
                permMohalla: parents.permanentAddress?.mohalla || null,
                permVillage: parents.permanentAddress?.village || "",
                permWardNumber: parents.permanentAddress?.wardNumber || null,
                permSubDistrict: parents.permanentAddress?.subDistrict || "",
                permBlock: parents.permanentAddress?.block || null,
                permDistrict: parents.permanentAddress?.district || "",
                permState: parents.permanentAddress?.state || "",
                permPinCode: parents.permanentAddress?.pinCode || "",
                permPostOffice: parents.permanentAddress?.postOffice || null,
            }
        },
        informant: {
            create: {
                name: informationProvider.name || "",
                adharNumber: informationProvider.adharNumber || null,
                adharCardUrl: informationProvider.adharCardUrl || null,
                mobileNumber: informationProvider.mobileNumber || "",
                email: informationProvider.email || null,
                providedInformation: Boolean(informationProvider.providedInformation),

                informantPlotNumber: informationProvider.informaionProviderAddress?.plotNumber || null,
                informantVillage: informationProvider.informaionProviderAddress?.village || "",
                informantWardNumber: informationProvider.informaionProviderAddress?.wardNumber || null,
                informantSubDistrict: informationProvider.informaionProviderAddress?.subDistrict || "",
                informantBlock: informationProvider.informaionProviderAddress?.block || null,
                informantDistrict: informationProvider.informaionProviderAddress?.district || "",
                informantState: informationProvider.informaionProviderAddress?.state || "",
                informantPinCode: informationProvider.informaionProviderAddress?.pinCode || "",
                informantPostOffice: informationProvider.informaionProviderAddress?.postOffice || null,

                motherCity: informationProvider.motherAddress?.city || "",
                motherSubDistrict: informationProvider.motherAddress?.subDistrict || "",
                motherBlock: informationProvider.motherAddress?.block || null,
                motherDistrict: informationProvider.motherAddress?.district || "",
                motherState: informationProvider.motherAddress?.state || "",
                motherPinCode: informationProvider.motherAddress?.pinCode || "",
                motherPostOffice: informationProvider.motherAddress?.postOffice || null,

                motherReligion: informationProvider.motherReligion || "",
                fatherReligion: informationProvider.fatherReligion || "",
                motherLiteracy: informationProvider.motherLiteracy || null,
                fatherLiteracy: informationProvider.fatherLiteracy || null,
                motherProfession: informationProvider.motherProfession || null,
                fatherProfession: informationProvider.fatherProfession || null,
                motherAgeAtMirrage: informationProvider.motherAgeAtMirrage ? parseInt(informationProvider.motherAgeAtMirrage, 10) : null,
                motherAgeAtChildBirth: informationProvider.motherAgeAtChildBirth ? parseInt(informationProvider.motherAgeAtChildBirth, 10) : null,
                motherChildNumber: informationProvider.motherChildNumber ? parseInt(informationProvider.motherChildNumber, 10) : null,
                relationToChild: informationProvider.relationToChild || null,
                declarationAccepted: Boolean(informationProvider.declarationAccepted),
            }
        }
    };
}

export const applicationIncludeRelations = {
    child: true,
    parents: true,
    informant: true,
};
