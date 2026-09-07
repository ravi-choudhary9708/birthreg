"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FACILITIES } from "@/utils/constants";

// Comprehensive verified directory data for all 39 healthcare facilities in Madhubani District
const FACILITY_CONTACTS = {
  "REFERRAL HOSPITAL ANDHRATHARI": {
    block: "Andhrathari",
    pin: "847401",
    phone: "06276-284201",
    altPhone: "+91 9470003434",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Hospital Road, Andhrathari Block HQ, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["24x7 Delivery", "Referral Care", "Immunization", "CRS Registration"],
  },
  "PHC ANDHRATHADHI": {
    block: "Andhrathari",
    pin: "847401",
    phone: "06276-284201",
    altPhone: "+91 9470003434",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "PHC Campus, Andhrathadhi, Madhubani",
    timing: "24x7 Emergency & Delivery / 9 AM - 5 PM Registry",
    features: ["Delivery Wing", "Primary Healthcare", "CRS Registration"],
  },
  "PHC BABUBARHI": {
    block: "Babubarhi",
    pin: "847224",
    phone: "+91 9470003434",
    altPhone: "06276-224425",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "PHC Campus, Babubarhi Block HQ, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Maternity Care", "Primary Outpatient", "CRS Registration"],
  },
  "CHC BABUBARHI": {
    block: "Babubarhi",
    pin: "847224",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Community Health Centre, Babubarhi Market Road, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["Inpatient Beds", "24x7 Delivery", "SNCU Support", "CRS Registration"],
  },
  "PRIMARY HEALTH CENTRE BASOPATTI": {
    block: "Basopatti",
    pin: "847225",
    phone: "+91 9470003434",
    altPhone: "06276-224425",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Hospital Road, Basopatti Block, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Maternity Care", "Immunization", "CRS Registration"],
  },
  "PHC BENIPATTI MADHUBANI": {
    block: "Benipatti",
    pin: "847223",
    phone: "06271-222078",
    altPhone: "+91 9470003434",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "SH-52, Benipatti Sub-Division, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Sub-Divisional Hub", "24x7 Maternity", "Emergency Wing", "CRS Registration"],
  },
  "PRIMARI HEALTH CENTRE BISFI": {
    block: "Bisfi",
    pin: "847122",
    phone: "+91 9470003434",
    altPhone: "06276-224425",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Block Headquarters Road, Bisfi, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Delivery Wing", "Child Healthcare", "CRS Registration"],
  },
  "CHC BISFI": {
    block: "Bisfi",
    pin: "847122",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "CHC Complex, Near Block Office, Bisfi, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["Inpatient Beds", "24x7 Maternity Care", "CRS Registration"],
  },
  "PHC GHOGHARDIHA": {
    block: "Ghoghardiha",
    pin: "847402",
    phone: "06277-282770",
    altPhone: "+91 9470003438",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "PHC Hospital Campus, Ghoghardiha, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["24x7 Delivery Care", "Emergency Outpatient", "CRS Registration"],
  },
  "PHC HARLAKHI": {
    block: "Harlakhi",
    pin: "847240",
    phone: "+91 9470003434",
    altPhone: "06276-224425",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "PHC Umgaon, Harlakhi Block, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Maternity Care", "Primary Outpatient", "CRS Registration"],
  },
  "CHC HARLAKHI": {
    block: "Harlakhi",
    pin: "847240",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "CHC Campus, Umgaon-Harlakhi Road, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["Inpatient Beds", "24x7 Delivery Hub", "CRS Registration"],
  },
  "SUB DIVISIONAL HOSPITAL, JAYNAGAR": {
    block: "Jaynagar",
    pin: "847226",
    phone: "06246-222117",
    altPhone: "+91 9470003435",
    emergency: "102 / 108 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Station Road, Sub-Divisional Hospital Campus, Jaynagar, Madhubani",
    timing: "24x7 Multi-Specialty, Emergency & Maternity",
    features: ["Sub-Divisional Apex", "SNCU Newborn Care", "Operation Theatre", "CRS Registration"],
  },
  "PRIMARY HEALTH CENTRE JAYNAGAR": {
    block: "Jaynagar",
    pin: "847226",
    phone: "06246-222117",
    altPhone: "+91 9470003434",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "PHC Complex, Main Market, Jaynagar, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Delivery Wing", "Immunization", "CRS Registration"],
  },
  "SUPRITENDENT SUB DIVISIONAL HOSPITAL JHANJHARPUR": {
    block: "Jhanjharpur",
    pin: "847404",
    phone: "06273-222230",
    altPhone: "+91 9470003436",
    emergency: "102 / 108 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Court Compound Road, SDH Campus, Jhanjharpur Sub-Division, Madhubani",
    timing: "24x7 Multi-Specialty, Inpatient & Maternity Care",
    features: ["Sub-Divisional Apex", "SNCU Newborn Unit", "Trauma & Maternity", "CRS Registration"],
  },
  "PRIMARY HEALTH CENTRE JHANJHARPUR": {
    block: "Jhanjharpur",
    pin: "847404",
    phone: "06273-222230",
    altPhone: "+91 9470003434",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "PHC Campus, Near Railway Station, Jhanjharpur, Madhubani",
    timing: "24x7 Emergency & Delivery / 9 AM - 5 PM Registry",
    features: ["Delivery Ward", "Primary Care", "CRS Registration"],
  },
  "PHC KALUAHI": {
    block: "Kaluahi",
    pin: "847229",
    phone: "+91 9470003434",
    altPhone: "06276-224425",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "PHC Campus, Kaluahi Block HQ, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Maternity Care", "Immunization Registry", "CRS Registration"],
  },
  "CHC KALUAHI": {
    block: "Kaluahi",
    pin: "847229",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Community Health Centre, Kaluahi, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["Inpatient Beds", "24x7 Delivery Hub", "CRS Registration"],
  },
  "PRIMARY HEALTH CENTRE KHAJAULI": {
    block: "Khajauli",
    pin: "847228",
    phone: "+91 9470003434",
    altPhone: "06276-224425",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Hospital Road, Khajauli Block HQ, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Maternity Wing", "Primary Outpatient", "CRS Registration"],
  },
  "CHC KHAJAULI": {
    block: "Khajauli",
    pin: "847228",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "CHC Complex, Station Road, Khajauli, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["Inpatient Beds", "24x7 Delivery Care", "CRS Registration"],
  },
  "PHC KHUTAUNA": {
    block: "Khutauna",
    pin: "847227",
    phone: "+91 9470003434",
    altPhone: "06276-224425",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "PHC Campus, Khutauna Block HQ, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Maternity Care", "Child Immunization", "CRS Registration"],
  },
  "CHC KHUTAUNA": {
    block: "Khutauna",
    pin: "847227",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Community Health Centre, Khutauna, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["Inpatient Beds", "24x7 Delivery Hub", "CRS Registration"],
  },
  "PRIMARY HEALTH CENTRE LADANIA": {
    block: "Ladania",
    pin: "847232",
    phone: "06276-275198",
    altPhone: "+91 9470003434",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "PHC Campus, Ladania Block HQ, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Maternity Care", "Primary Outpatient", "CRS Registration"],
  },
  "CHC LADANIA": {
    block: "Ladania",
    pin: "847232",
    phone: "06276-275198",
    altPhone: "+91 9470003434",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "CHC Campus, Border Road, Ladania, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["Inpatient Beds", "24x7 Delivery Care", "CRS Registration"],
  },
  "PRIMARY HEALTH CENTRE LAKHNAUR": {
    block: "Lakhnaur",
    pin: "847103",
    phone: "+91 9470003434",
    altPhone: "06276-224425",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "PHC Complex, Lakhnaur Block HQ, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Maternity Ward", "Primary Care", "CRS Registration"],
  },
  "CHC LAKHNAUR": {
    block: "Lakhnaur",
    pin: "847103",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "CHC Campus, Near Block Office, Lakhnaur, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["Inpatient Beds", "24x7 Delivery Hub", "CRS Registration"],
  },
  "PHC LAUKAHI MADHUBANI": {
    block: "Laukahi",
    pin: "847421",
    phone: "+91 9470003434",
    altPhone: "06276-224425",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "PHC Campus, Laukahi Market Road, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Delivery Ward", "Primary Care", "CRS Registration"],
  },
  "CHC LAUKAHI": {
    block: "Laukahi",
    pin: "847421",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "CHC Complex, Main Road, Laukahi, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["Inpatient Beds", "24x7 Delivery Hub", "CRS Registration"],
  },
  "PRIMARY HEALTH CENTRE MADHEPUR": {
    block: "Madhepur",
    pin: "847408",
    phone: "+91 9470003434",
    altPhone: "06276-224425",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "PHC Hospital Road, Madhepur Block HQ, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Maternity Care", "Primary Outpatient", "CRS Registration"],
  },
  "SADAR HOSPITAL MADHUBANI": {
    block: "Madhubani Sadar",
    pin: "847211",
    phone: "06276-222050",
    altPhone: "+91 9470003434",
    emergency: "102 / 108 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Hospital Road, Near DM Office & Civil Court, Madhubani Sadar",
    timing: "24x7 District Apex Emergency, Trauma & Maternity",
    features: [
      "District Apex Hospital",
      "Special Newborn Care Unit (SNCU)",
      "MCH Comprehensive Wing",
      "District Blood Bank",
      "Central CRS Civil Registry",
    ],
  },
  "PRIMARY HEALTH CENTRE MADHWAPUR": {
    block: "Madhwapur",
    pin: "847305",
    phone: "06271-283383",
    altPhone: "+91 9470003434",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "PHC Campus, Madhwapur Block HQ, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Maternity Care", "Immunization", "CRS Registration"],
  },
  "CHC MADHWAPUR": {
    block: "Madhwapur",
    pin: "847305",
    phone: "06271-283383",
    altPhone: "+91 9470003434",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Community Health Centre, Madhwapur, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["Inpatient Beds", "24x7 Delivery Hub", "CRS Registration"],
  },
  "APHC MAHRAIL": {
    block: "Andhrathari",
    pin: "847401",
    phone: "+91 9470003434",
    altPhone: "06276-284201",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Additional PHC, Mahrail Village, Andhrathari Block, Madhubani",
    timing: "24x7 Maternity & Primary Outpatient / 9 AM - 5 PM Registry",
    features: ["Maternity Services", "Primary Health", "CRS Registration"],
  },
  "PRIMARY HEALTH CENTRE PANDAUL": {
    block: "Pandaul",
    pin: "847234",
    phone: "+91 9470003434",
    altPhone: "06276-224425",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "PHC Campus, Sakri-Pandaul Road, Pandaul, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Maternity Care", "Primary Outpatient", "CRS Registration"],
  },
  "SUPRITENDENT SUB DIVISIONAL HOSPITAL PHULPARAS": {
    block: "Phulparas",
    pin: "847409",
    phone: "06277-224210",
    altPhone: "+91 9470003437",
    emergency: "102 / 108 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "NH-57, SDH Campus, Phulparas Sub-Division, Madhubani",
    timing: "24x7 Multi-Specialty, Trauma & Maternity Hub",
    features: ["Sub-Divisional Apex", "Trauma & Delivery", "Inpatient Beds", "CRS Registration"],
  },
  "PRIMARY HEALTH CENTRE PHULPARAS": {
    block: "Phulparas",
    pin: "847409",
    phone: "06277-224210",
    altPhone: "+91 9470003434",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "PHC Campus, Phulparas Block HQ, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Delivery Ward", "Immunization", "CRS Registration"],
  },
  "PRIMARY HEALTH CENTER RAHIKA": {
    block: "Rahika",
    pin: "847238",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "PHC Campus, Rahika Block HQ, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Maternity Ward", "Primary Care", "CRS Registration"],
  },
  "CHC RAHIKA": {
    block: "Rahika",
    pin: "847238",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "CHC Campus, Rahika-Madhubani Main Road, Rahika, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["Inpatient Beds", "24x7 Delivery Care", "CRS Registration"],
  },
  "PRIMARY HEALTH CENTRE RAJNAGAR": {
    block: "Rajnagar",
    pin: "847235",
    phone: "+91 9470003434",
    altPhone: "06276-224425",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "PHC Campus, Near Rajnagar Heritage Complex, Rajnagar, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Maternity Care", "Primary Outpatient", "CRS Registration"],
  },
  "CHC RAJNAGAR": {
    block: "Rajnagar",
    pin: "847235",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "CHC Complex, Main Market, Rajnagar Block, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["Inpatient Beds", "24x7 Delivery Hub", "CRS Registration"],
  },
};

function getFacilityMeta(name) {
  const contact = FACILITY_CONTACTS[name] || {
    block: "Madhubani",
    pin: "847211",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Health Facility Campus, Madhubani District, Bihar",
    timing: "24x7 Delivery & Emergency / 9 AM - 5 PM Registry",
    features: ["Birth Registration", "Maternity Care"],
  };

  if (name.includes("SADAR HOSPITAL")) {
    return {
      name,
      categoryKey: "SADAR",
      type: "District Apex Hospital",
      tag: "District Apex Hospital",
      badgeColor: "#92400e",
      badgeBg: "#fef3c7",
      badgeBorder: "#fde68a",
      icon: "🏥",
      level: "Apex Civil Hospital",
      ...contact,
    };
  }

  if (name.includes("SUB DIVISIONAL") || name.includes("REFERRAL")) {
    return {
      name,
      categoryKey: "SDH",
      type: "Sub-Divisional / Referral Hospital",
      tag: "SDH / Referral Hub",
      badgeColor: "#6b21a8",
      badgeBg: "#f3e8ff",
      badgeBorder: "#e9d5ff",
      icon: "🏛️",
      level: "Secondary Referral Hub",
      ...contact,
    };
  }

  if (name.startsWith("CHC ") || name.includes(" CHC")) {
    return {
      name,
      categoryKey: "CHC",
      type: "Community Health Centre",
      tag: "CHC (Community Hub)",
      badgeColor: "#065f46",
      badgeBg: "#ecfdf5",
      badgeBorder: "#a7f3d0",
      icon: "🏨",
      level: "Community Health Centre",
      ...contact,
    };
  }

  return {
    name,
    categoryKey: "PHC",
    type: name.includes("APHC") ? "Additional Primary Health Centre" : "Primary Health Centre",
    tag: name.includes("APHC") ? "APHC" : "PHC (Primary Care)",
    badgeColor: "#1e40af",
    badgeBg: "#eff6ff",
    badgeBorder: "#bfdbfe",
    icon: "🩺",
    level: "Primary Care Registry",
    ...contact,
  };
}

const FACILITY_METAS = FACILITIES.map(getFacilityMeta);

const CATEGORY_TABS = [
  { key: "ALL", label: "All Facilities", count: 39 },
  { key: "SADAR", label: "District Hospital", count: 1 },
  { key: "SDH", label: "Sub-Divisional & Referral", count: 4 },
  { key: "CHC", label: "CHCs (Community)", count: 12 },
  { key: "PHC", label: "PHCs & APHCs", count: 22 },
];

export default function FacilitiesPage() {
  const containerRef = useRef(null);
  const cardsGridRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedPhone, setCopiedPhone] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Filter facilities
  const filteredFacilities = useMemo(() => {
    return FACILITY_METAS.filter((f) => {
      const matchesCategory =
        selectedCategory === "ALL" || f.categoryKey === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.block.toLowerCase().includes(q) ||
        f.address.toLowerCase().includes(q) ||
        f.pin.includes(q) ||
        f.phone.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // GSAP animations setup
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // 1. Header entrance
      gsap.from(".anim-fac-header", {
        y: -20,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
      });

      // 2. Hero Timeline
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroTl
        .from(".anim-fac-breadcrumb", { y: -10, opacity: 0, duration: 0.4 })
        .from(".anim-fac-tag", { scale: 0.85, opacity: 0, duration: 0.5, ease: "back.out(1.7)" }, "-=0.2")
        .from(".anim-fac-title", { y: 22, opacity: 0, duration: 0.6 }, "-=0.25")
        .from(".anim-fac-desc", { y: 16, opacity: 0, duration: 0.5 }, "-=0.3")
        .from(".anim-fac-emergency-bar", { y: 20, opacity: 0, duration: 0.6 }, "-=0.2")
        .from(".anim-fac-stat", {
          y: 20,
          opacity: 0,
          stagger: 0.1,
          duration: 0.5,
          ease: "power2.out",
        }, "-=0.3")
        .from(".anim-fac-filters", { y: 18, opacity: 0, duration: 0.5 }, "-=0.2");

      // 3. Stagger Facility cards when entering viewport
      if (cardsGridRef.current) {
        gsap.from(".fac-card", {
          scrollTrigger: {
            trigger: cardsGridRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
          y: 24,
          opacity: 0,
          stagger: 0.04,
          duration: 0.5,
          ease: "power2.out",
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Smooth scroll listener for "Back to top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll helper (Lenis-aware with standard window fallback)
  const smoothScrollTo = (targetY = 0) => {
    if (typeof window !== "undefined") {
      window.scrollTo({
        top: targetY,
        behavior: "smooth",
      });
    }
  };

  const handleCategorySelect = (key) => {
    setSelectedCategory(key);
    // Smooth scroll slightly down to results if at top
    if (cardsGridRef.current && window.scrollY < 280) {
      cardsGridRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const copyToClipboard = (text, facilityName) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedPhone(facilityName);
      setTimeout(() => setCopiedPhone(null), 2500);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.2); }
        }
        .pulse-dot {
          animation: pulseDot 2s ease-in-out infinite;
        }
        .fac-card {
          transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .fac-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px -6px rgba(15, 23, 42, 0.08), 0 6px 12px -4px rgba(15, 23, 42, 0.04);
          border-color: #93c5fd;
        }
        .fac-btn-apply {
          transition: all 0.18s ease;
        }
        .fac-btn-apply:hover {
          background: #1e40af !important;
          color: #ffffff !important;
          border-color: #1e40af !important;
        }
        .fac-btn-call {
          transition: all 0.18s ease;
        }
        .fac-btn-call:hover {
          background: #ecfdf5 !important;
          border-color: #059669 !important;
          color: #047857 !important;
        }
        .category-tab-btn {
          transition: all 0.16s ease;
        }
        .category-tab-btn:hover:not(.active) {
          background: #e2e8f0;
          color: #1e293b;
        }
        .scroll-top-btn {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .scroll-top-btn:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 10px 20px rgba(30, 64, 175, 0.3);
        }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .emergency-bar-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
          .mobile-nav-drawer { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <header
        className="anim-fac-header"
        style={{
          borderBottom: "1px solid #e2e8f0",
          padding: "0 16px",
          position: "sticky",
          top: 0,
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(12px)",
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 64,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/"
              style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}
              title="Government of Bihar"
            >
              <img
                src="/bihar_government.webp"
                alt="Government of Bihar Seal"
                style={{
                  height: 42,
                  width: "auto",
                  maxHeight: 42,
                  objectFit: "contain",
                  display: "block",
                }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/logo.png";
                }}
              />
            </Link>

            <div
              style={{
                width: 1,
                height: 36,
                backgroundColor: "#d1d5db",
                flexShrink: 0,
              }}
              aria-hidden="true"
            />

            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <Image
                src="/baby_birth.svg"
                alt="Birth Certificate Portal Logo"
                width={38}
                height={38}
                priority
                loading="eager"
                style={{ objectFit: "contain" }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", lineHeight: 1.2 }}>
                  Birth Certificate Portal
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>
                  District Administration Madhubani • Govt. of Bihar
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link
              href="/"
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                color: "#475569",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Home
            </Link>
            <Link
              href="/facilities"
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                color: "#1e40af",
                background: "#eff6ff",
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Facility Directory
            </Link>
            <Link
              href="/track"
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                color: "#475569",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Track Application
            </Link>
            <Link
              href="/login"
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                color: "#64748b",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Staff Login
            </Link>
            <Link
              href="/apply"
              style={{
                padding: "9px 20px",
                background: "#1e40af",
                color: "white",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                marginLeft: 4,
              }}
            >
              Apply Now
            </Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              padding: 8,
              color: "#374151",
            }}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div
            className="mobile-nav-drawer"
            style={{
              padding: "12px 16px 16px",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              background: "white",
            }}
          >
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              style={{ padding: "10px 14px", borderRadius: 8, color: "#374151", fontSize: 14, fontWeight: 500, textDecoration: "none" }}
            >
              🏠 Home
            </Link>
            <Link
              href="/facilities"
              onClick={() => setMobileMenuOpen(false)}
              style={{ padding: "10px 14px", borderRadius: 8, color: "#1e40af", background: "#eff6ff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}
            >
              🏥 Facility Directory (39 Facilities)
            </Link>
            <Link
              href="/track"
              onClick={() => setMobileMenuOpen(false)}
              style={{ padding: "10px 14px", borderRadius: 8, color: "#374151", fontSize: 14, fontWeight: 600, textDecoration: "none" }}
            >
              🔍 Track Application
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              style={{ padding: "10px 14px", borderRadius: 8, color: "#6b7280", fontSize: 14, fontWeight: 500, textDecoration: "none" }}
            >
              🔒 Staff Login
            </Link>
            <Link
              href="/apply"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                padding: "11px 16px",
                background: "#1e40af",
                color: "white",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                textAlign: "center",
                textDecoration: "none",
                marginTop: 4,
              }}
            >
              Apply for Birth Certificate
            </Link>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          padding: "clamp(20px, 3.5vw, 40px) clamp(16px, 3vw, 28px)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          
          {/* Breadcrumb */}
          <div className="anim-fac-breadcrumb" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b", marginBottom: 14 }}>
            <Link href="/" style={{ color: "#2563eb", textDecoration: "none" }}>Home</Link>
            <span>/</span>
            <span style={{ color: "#0f172a", fontWeight: 600 }}>Facility Directory & Contact Helpdesk</span>
          </div>

          {/* Page Hero Header */}
          <div style={{ marginBottom: 28 }}>
            <div
              className="anim-fac-tag"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 14px",
                borderRadius: 99,
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                color: "#1e40af",
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />
              Civil Registration System (CRS) • Madhubani Healthcare Directory
            </div>
            <h1
              className="anim-fac-title"
              style={{
                fontSize: "clamp(26px, 4vw, 36px)",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.025em",
                margin: "0 0 10px 0",
                lineHeight: 1.2,
              }}
            >
              Authorized Healthcare Facilities & Contact Directory
            </h1>
            <p
              className="anim-fac-desc"
              style={{
                color: "#475569",
                fontSize: "clamp(14px, 2vw, 16px)",
                maxWidth: 840,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Official registry of all 39 designated government institutions in Madhubani District for institutional birth registration under the Civil Registration System (CRS). Includes verified hospital telephone lines, 24x7 ambulance helplines, addresses, and instant online application routing.
            </p>
          </div>

          {/* District Emergency & Helpdesk Banner */}
          <div
            className="anim-fac-emergency-bar"
            style={{
              background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #f0fdf4 100%)",
              borderRadius: 16,
              padding: "clamp(20px, 3vw, 24px)",
              marginBottom: 30,
              boxShadow: "0 4px 16px -2px rgba(30, 64, 175, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)",
              border: "1.5px solid #bfdbfe",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "3px 10px",
                    borderRadius: 99,
                    background: "#fee2e2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    fontSize: 11.5,
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#dc2626" }} />
                  <span>24x7 District Health Emergency & Assistance</span>
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0", letterSpacing: "-0.01em" }}>
                  District Health Emergency & Civil Registration Helpdesk
                </h2>
                <div style={{ fontSize: 13, color: "#475569" }}>
                  Official 24x7 emergency helpline, ambulance dispatch, and Civil Surgeon desk for Madhubani District.
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a
                  href="tel:102"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 18px",
                    borderRadius: 10,
                    background: "#dc2626",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 2px 6px rgba(220, 38, 38, 0.3)",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <span>🚑 Ambulance: 102</span>
                </a>
                <a
                  href="tel:9470003434"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 18px",
                    borderRadius: 10,
                    background: "#1e40af",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 2px 6px rgba(30, 64, 175, 0.3)",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <span>📞 Civil Surgeon: 9470003434</span>
                </a>
              </div>
            </div>

            {/* Emergency Contacts Grid */}
            <div
              className="emergency-bar-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                gap: 14,
                paddingTop: 16,
                borderTop: "1px solid #dbeafe",
              }}
            >
              <div style={{ background: "#ffffff", borderRadius: 12, padding: "14px 16px", border: "1px solid #bfdbfe", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#1e40af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>Civil Surgeon Office</span>
                  <span style={{ fontSize: 13 }}>🏥</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#1e3a8a", marginTop: 2 }}>
                  <a href="tel:06276222050" style={{ color: "#1e3a8a", textDecoration: "none" }}>06276-222050</a>
                  <span style={{ color: "#94a3b8", fontWeight: 400, margin: "0 4px" }}>/</span>
                  <a href="tel:9470003434" style={{ color: "#1e3a8a", textDecoration: "none" }}>9470003434</a>
                </div>
                <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>Hospital Rd, Madhubani Sadar</div>
              </div>

              <div style={{ background: "#ffffff", borderRadius: 12, padding: "14px 16px", border: "1px solid #bbf7d0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#065f46", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>Janani Express (Ambulance)</span>
                  <span style={{ fontSize: 13 }}>🚑</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#047857", marginTop: 2 }}>
                  <a href="tel:102" style={{ color: "#047857", textDecoration: "none" }}>102 (Toll-Free 24x7)</a>
                </div>
                <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>Free for Pregnant Mothers & Infants</div>
              </div>

              <div style={{ background: "#ffffff", borderRadius: 12, padding: "14px 16px", border: "1px solid #bfdbfe", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#1d4ed8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>Bihar Swasthya Helpline</span>
                  <span style={{ fontSize: 13 }}>🩺</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#1d4ed8", marginTop: 2 }}>
                  <a href="tel:104" style={{ color: "#1d4ed8", textDecoration: "none" }}>104 (Medical Guidance)</a>
                </div>
                <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>Free doctor consultation & health advice</div>
              </div>

              <div style={{ background: "#ffffff", borderRadius: 12, padding: "14px 16px", border: "1px solid #fed7aa", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#c2410c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>District Control Room</span>
                  <span style={{ fontSize: 13 }}>📞</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#9a3412", marginTop: 2 }}>
                  <a href="tel:06276224425" style={{ color: "#9a3412", textDecoration: "none" }}>06276-224425</a>
                </div>
                <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>Madhubani Collectorate Desk</div>
              </div>
            </div>
          </div>

          {/* Metric Cards Summary */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              marginBottom: 30,
            }}
          >
            <div
              className="anim-fac-stat"
              style={{
                background: "white",
                borderRadius: 14,
                padding: "16px 20px",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: 14,
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ fontSize: 26, background: "#eff6ff", width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>🏥</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#1e3a8a", lineHeight: 1.1 }}>39</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Total Healthcare Facilities</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Covering all 21 Blocks of Madhubani</div>
              </div>
            </div>

            <div
              className="anim-fac-stat"
              style={{
                background: "white",
                borderRadius: 14,
                padding: "16px 20px",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: 14,
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ fontSize: 26, background: "#fef3c7", width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>⭐</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#92400e", lineHeight: 1.1 }}>1</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>District Apex Hospital</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Sadar Hospital Madhubani (24x7 SNCU)</div>
              </div>
            </div>

            <div
              className="anim-fac-stat"
              style={{
                background: "white",
                borderRadius: 14,
                padding: "16px 20px",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: 14,
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ fontSize: 26, background: "#f3e8ff", width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>🏛️</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#6b21a8", lineHeight: 1.1 }}>4</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Sub-Divisional & Referral</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Jaynagar, Jhanjharpur, Phulparas, Andhrathari</div>
              </div>
            </div>

            <div
              className="anim-fac-stat"
              style={{
                background: "white",
                borderRadius: 14,
                padding: "16px 20px",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: 14,
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ fontSize: 26, background: "#ecfdf5", width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>🏨</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#065f46", lineHeight: 1.1 }}>34</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>CHCs & PHCs Network</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>12 CHCs + 22 PHCs / APHCs</div>
              </div>
            </div>
          </div>

          {/* Interactive Search & Filter Controls */}
          <div
            id="main-content"
            tabIndex={-1}
            className="anim-fac-filters"
            style={{
              background: "white",
              borderRadius: 16,
              padding: "clamp(18px, 3vw, 24px)",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 5px rgba(0,0,0,0.03)",
              marginBottom: 24,
              scrollMarginTop: "90px",
              outline: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 18,
              }}
            >
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0" }}>
                  Filter Facilities & Verified Contact Details
                </h2>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                  Search by hospital name, block, PIN code, address, or telephone number.
                </p>
              </div>

              {/* Search input */}
              <div style={{ position: "relative", minWidth: 280, maxWidth: 420, width: "100%" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                    fontSize: 15,
                    pointerEvents: "none",
                  }}
                >
                  🔍
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hospital, block, PIN, or phone..."
                  style={{
                    width: "100%",
                    padding: "10px 36px 10px 38px",
                    fontSize: 13,
                    borderRadius: 10,
                    border: "1.5px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#1e293b",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "#e2e8f0",
                      border: "none",
                      borderRadius: "50%",
                      width: 20,
                      height: 20,
                      fontSize: 11,
                      color: "#64748b",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Category Pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CATEGORY_TABS.map((tab) => {
                const isActive = selectedCategory === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleCategorySelect(tab.key)}
                    className={`category-tab-btn ${isActive ? "active" : ""}`}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "#ffffff" : "#475569",
                      background: isActive ? "#1e40af" : "#f1f5f9",
                      border: isActive ? "1px solid #1e40af" : "1px solid #e2e8f0",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>{tab.label}</span>
                    <span
                      style={{
                        padding: "1px 6px",
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 700,
                        background: isActive ? "rgba(255,255,255,0.25)" : "#e2e8f0",
                        color: isActive ? "#ffffff" : "#64748b",
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              fontSize: 13,
              color: "#64748b",
              fontWeight: 500,
            }}
          >
            <span>
              Showing <strong>{filteredFacilities.length}</strong> of <strong>39</strong> registered facilities across Madhubani District
            </span>
            {(selectedCategory !== "ALL" || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSearchQuery("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Reset all filters
              </button>
            )}
          </div>

          {/* Empty State */}
          {filteredFacilities.length === 0 ? (
            <div
              style={{
                padding: "60px 20px",
                textAlign: "center",
                background: "white",
                borderRadius: 16,
                border: "1px dashed #cbd5e1",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>
                No facilities found
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20, maxWidth: 440, margin: "0 auto 20px" }}>
                No healthcare facility matched &ldquo;{searchQuery}&rdquo;. Try another hospital name, block, or PIN code.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSearchQuery("");
                }}
                style={{
                  padding: "9px 20px",
                  background: "#1e40af",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Show All 39 Facilities
              </button>
            </div>
          ) : (
            /* Facility Cards Grid */
            <div
              ref={cardsGridRef}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                gap: 18,
              }}
            >
              {filteredFacilities.map((f) => (
                <div
                  key={f.name}
                  className="fac-card"
                  style={{
                    background: "#ffffff",
                    borderRadius: 14,
                    border: "1px solid #e2e8f0",
                    padding: "20px 22px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    {/* Card Top: Type Badge & Active Status */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 12,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 6,
                          background: f.badgeBg,
                          color: f.badgeColor,
                          border: `1px solid ${f.badgeBorder}`,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span>{f.icon}</span>
                        <span>{f.tag}</span>
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#16a34a",
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          background: "#f0fdf4",
                          padding: "2px 8px",
                          borderRadius: 99,
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        <span
                          className="pulse-dot"
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#16a34a",
                          }}
                        />
                        CRS Active
                      </span>
                    </div>

                    {/* Facility Name */}
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#0f172a",
                        lineHeight: 1.4,
                        marginBottom: 12,
                      }}
                    >
                      {f.name}
                    </h3>

                    {/* Location & Block Info */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        fontSize: 12,
                        color: "#475569",
                        marginBottom: 14,
                        paddingBottom: 14,
                        borderBottom: "1px dashed #e2e8f0",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>📍</span>
                        <div style={{ lineHeight: 1.4 }}>
                          <span style={{ fontWeight: 600, color: "#1e293b" }}>Block: {f.block}</span>
                          <span style={{ color: "#94a3b8" }}> • </span>
                          <span>PIN: <strong style={{ color: "#0f172a" }}>{f.pin}</strong></span>
                          <div style={{ color: "#64748b", fontSize: 11.5, marginTop: 2 }}>{f.address}</div>
                        </div>
                      </div>

                      {/* Contact Phone Row */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6, background: "#f8fafc", padding: "8px 10px", borderRadius: 8, border: "1px solid #edf2f7" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13 }}>📞</span>
                          <span style={{ fontWeight: 600, color: "#1e293b", fontSize: 12 }}>Phone:</span>
                          <a
                            href={`tel:${f.phone.replace(/[^0-9+]/g, "")}`}
                            style={{
                              color: "#2563eb",
                              fontWeight: 700,
                              textDecoration: "none",
                              fontSize: 12,
                            }}
                          >
                            {f.phone}
                          </a>
                        </div>
                        <button
                          onClick={() => copyToClipboard(f.phone, f.name)}
                          style={{
                            background: copiedPhone === f.name ? "#dcfce7" : "#e2e8f0",
                            color: copiedPhone === f.name ? "#166534" : "#475569",
                            border: "none",
                            borderRadius: 4,
                            padding: "2px 7px",
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                          title="Copy phone number"
                        >
                          {copiedPhone === f.name ? "✓ Copied" : "Copy"}
                        </button>
                      </div>

                      {/* Emergency & Hours */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#64748b" }}>
                        <span style={{ fontSize: 13 }}>⏱️</span>
                        <span>{f.timing}</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#b91c1c" }}>
                        <span style={{ fontSize: 13 }}>🚨</span>
                        <span>Emergency / Ambulance: <strong>{f.emergency}</strong></span>
                      </div>
                    </div>

                    {/* Features Tags */}
                    {f.features && f.features.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
                        {f.features.map((feat) => (
                          <span
                            key={feat}
                            style={{
                              fontSize: 10.5,
                              padding: "2px 7px",
                              background: "#f1f5f9",
                              color: "#475569",
                              borderRadius: 4,
                              fontWeight: 500,
                            }}
                          >
                            {feat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Direct Action Buttons */}
                  <div style={{ paddingTop: 12, borderTop: "1px solid #f1f5f9", display: "flex", gap: 8 }}>
                    <a
                      href={`tel:${f.phone.replace(/[^0-9+]/g, "")}`}
                      className="fac-btn-call"
                      style={{
                        padding: "9px 12px",
                        borderRadius: 8,
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        color: "#047857",
                        fontSize: 12.5,
                        fontWeight: 600,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span>📞</span>
                      <span>Call</span>
                    </a>

                    <Link
                      href={`/apply?facility=${encodeURIComponent(f.name)}`}
                      className="fac-btn-apply"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flex: 1,
                        gap: 6,
                        padding: "9px 14px",
                        borderRadius: 8,
                        background: "#f8fafc",
                        border: "1px solid #cbd5e1",
                        color: "#1e40af",
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "none",
                        boxSizing: "border-box",
                      }}
                    >
                      <span>Apply for this Facility</span>
                      <span style={{ fontSize: 14 }}>→</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Assistance Banner */}
          <div
            style={{
              marginTop: 36,
              background: "#eff6ff",
              borderRadius: 14,
              border: "1px solid #bfdbfe",
              padding: "20px 24px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: "#1e3a8a", margin: "0 0 4px 0" }}>
                Did the delivery take place at home or outside listed hospitals?
              </h4>
              <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
                You can still register online under the official statutory registration rules. Simply select &ldquo;Home&rdquo; or &ldquo;Other Place&rdquo; on the birth registration form.
              </p>
            </div>
            <Link
              href="/apply"
              style={{
                padding: "10px 22px",
                background: "#1e40af",
                color: "white",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                whiteSpace: "nowrap",
                boxShadow: "0 1px 3px rgba(30,64,175,0.25)",
              }}
            >
              Start General Application →
            </Link>
          </div>

        </div>
      </main>

      {/* Floating Scroll to Top button */}
      {showScrollTop && (
        <button
          onClick={() => smoothScrollTo(0)}
          className="scroll-top-btn"
          aria-label="Scroll back to top"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "#1e40af",
            color: "white",
            border: "none",
            boxShadow: "0 4px 14px rgba(30, 64, 175, 0.35)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 700,
            zIndex: 99,
          }}
          title="Back to Top"
        >
          ↑
        </button>
      )}

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #e2e8f0",
          padding: "32px 16px 24px",
          background: "#ffffff",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          <Image
            src="/baby_birth.svg"
            alt="Govt. of Bihar Logo"
            width={28}
            height={28}
            style={{ objectFit: "contain" }}
          />
          <span style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>
            Government of Bihar • District Administration Madhubani
          </span>
        </div>
        <p style={{ color: "#6b7280", fontSize: 12, lineHeight: 1.5, margin: "0 0 6px" }}>
          Official Birth Registration & Certification Portal — Civil Registration System (CRS)
        </p>
        <p style={{ color: "#9ca3af", fontSize: 11, margin: 0 }}>
          © {new Date().getFullYear()} District Health Society & Civil Surgeon Office, Madhubani, Bihar. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
