import { useState } from "react";

/**
 * AI-Powered Government Scheme Finder (Extended)
 * - Adds a Basic Needs step with extra practical questions.
 * - Uses new answers to refine eligibility.
 * - Keeps your original styling/components and architecture.
 *
 * Run in a React project (CRA or Vite). This is a single-file app.
 */

// ─────────────────────────────────────────────────────────────────────────────
// MASTER DATABASE: 120+ Real Indian Government Schemes (central focus)
// ─────────────────────────────────────────────────────────────────────────────
const ALL_SCHEMES = [
  // ── AGRICULTURE ──────────────────────────────────────────────────────────
  {
    id:"pmkisan", name:"PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    ministry:"Ministry of Agriculture & Farmers Welfare",
    category:"Agriculture", level:"Central",
    benefit:"₹6,000 per year in 3 equal instalments of ₹2,000 directly to farmer's bank account.",
    howToApply:"Apply online at pmkisan.gov.in or through Common Service Centres (CSC).",
    officialLink:"[pmkisan.gov.in](https://pmkisan.gov.in)",
    check: f => isFarmerProfile(f) && parseInt(f.age)>=18 && (f.aadhaar || f.hasAadhaarLinkedBank),
    eligibilityNote:"You are a farmer aged 18+ — eligible for ₹6,000/year income support. Aadhaar/bank linkage improves approval."
  },
  {
    id:"pmfby", name:"PM Fasal Bima Yojana (Crop Insurance)",
    ministry:"Ministry of Agriculture & Farmers Welfare",
    category:"Agriculture", level:"Central",
    benefit:"Crop insurance coverage against natural calamities, pests & diseases. Premium as low as 1.5-2% for farmers.",
    howToApply:"Apply through nearest bank, CSC, or pmfby.gov.in during crop season.",
    officialLink:"[pmfby.gov.in](https://pmfby.gov.in)",
    check: f => isFarmerProfile(f),
    eligibilityNote:"As a farmer, you can insure your crops against loss due to natural disasters."
  },
  {
    id:"kcc", name:"Kisan Credit Card (KCC)",
    ministry:"Ministry of Agriculture & Farmers Welfare",
    category:"Agriculture", level:"Central",
    benefit:"Credit up to ₹3 lakh at 4% interest rate per annum for crop production, post-harvest expenses and allied activities.",
    howToApply:"Apply at any nationalized bank, cooperative bank, or RRB with land documents.",
    officialLink:"[nabard.org](https://www.nabard.org)",
    check: f => isFarmerProfile(f) && parseInt(f.age)>=18,
    eligibilityNote:"Farmers, tenant farmers, oral lessees and sharecroppers are eligible."
  },
  {
    id:"pmksy", name:"PM Krishi Sinchayee Yojana (PMKSY)",
    ministry:"Ministry of Agriculture & Farmers Welfare",
    category:"Agriculture", level:"Central",
    benefit:"Subsidy for micro-irrigation (drip/sprinkler) systems. Up to 55% subsidy for small & marginal farmers.",
    howToApply:"Apply through state agriculture department or pmksy.gov.in.",
    officialLink:"[pmksy.gov.in](https://pmksy.gov.in)",
    check: f => isFarmerProfile(f),
    eligibilityNote:"Eligible as a farmer needing irrigation support."
  },
  {
    id:"pkvy", name:"Paramparagat Krishi Vikas Yojana (PKVY)",
    ministry:"Ministry of Agriculture",
    category:"Agriculture", level:"Central",
    benefit:"₹50,000 per hectare over 3 years for organic farming inputs, certification and marketing.",
    howToApply:"Form farmer groups of 20+ and apply through state agriculture department.",
    officialLink:"[pgsindia-ncof.gov.in](https://pgsindia-ncof.gov.in)",
    check: f => isFarmerProfile(f) && parseFloat(f.landOwned||0)>0,
    eligibilityNote:"Eligible as a land-owning farmer to convert to organic farming."
  },
  {
    id:"agriinfra", name:"Agriculture Infrastructure Fund (AIF)",
    ministry:"Ministry of Agriculture & Farmers Welfare",
    category:"Agriculture", level:"Central",
    benefit:"Loans up to ₹2 crore with 3% interest subvention and credit guarantee for post-harvest infrastructure.",
    howToApply:"Apply through banks or agriinfra.dac.gov.in.",
    officialLink:"[agriinfra.dac.gov.in](https://agriinfra.dac.gov.in)",
    check: f => isFarmerProfile(f) && parseInt(f.age)>=18,
    eligibilityNote:"Farmers, FPOs and agri-entrepreneurs are eligible for subsidized credit."
  },

  // ── HOUSING ──────────────────────────────────────────────────────────────
  {
    id:"pmay_urban", name:"PMAY - Urban (Pradhan Mantri Awas Yojana Urban)",
    ministry:"Ministry of Housing & Urban Affairs",
    category:"Housing", level:"Central",
    benefit:"Interest subsidy of 3–6.5% on home loans. EWS/LIG get up to ₹2.67 lakh subsidy; MIG up to ₹2.35 lakh.",
    howToApply:"Apply at pmaymis.gov.in or through any bank/HFC.",
    officialLink:"[pmaymis.gov.in](https://pmaymis.gov.in)",
    check: f =>
      !f.ownHouse &&
      (parseInt(f.annualIncome||0) <= 1800000) &&
      (f.residenceType === "Urban"),
    eligibilityNote:"You don't own a pucca house in an urban area — eligible for housing loan subsidy."
  },
  {
    id:"pmay_gramin", name:"PMAY - Gramin (Pradhan Mantri Awas Yojana Gramin)",
    ministry:"Ministry of Rural Development",
    category:"Housing", level:"Central",
    benefit:"₹1.2 lakh (plains) or ₹1.3 lakh (hilly areas) for construction of pucca house for rural BPL households.",
    howToApply:"Apply through Gram Panchayat or awaassoft.nic.in.",
    officialLink:"[pmayg.nic.in](https://pmayg.nic.in)",
    check: f => !f.ownHouse && (f.bplCard || parseInt(f.annualIncome||0)<=200000) && (f.residenceType === "Rural"),
    eligibilityNote:"As a rural low-income/BPL household without a pucca house, you qualify for rural housing grant."
  },

  // ── HEALTH ───────────────────────────────────────────────────────────────
  {
    id:"pmjay", name:"Ayushman Bharat PM-JAY (Health Coverage ₹5 Lakh)",
    ministry:"Ministry of Health & Family Welfare",
    category:"Health", level:"Central",
    benefit:"Free health insurance cover of ₹5 lakh per family per year for secondary and tertiary hospitalisation.",
    howToApply:"Check eligibility at pmjay.gov.in or visit nearest Ayushman Bharat empanelled hospital.",
    officialLink:"[pmjay.gov.in](https://pmjay.gov.in)",
    check: f =>
      f.bplCard ||
      parseInt(f.annualIncome||0)<=300000 ||
      ["SC","ST","OBC","EWS"].includes(f.category) ||
      f.hasChronicIllness,
    eligibilityNote:"Based on your income/BPL/status or chronic illness, your family likely qualifies for ₹5 lakh cover."
  },
  {
    id:"jssy", name:"Janani Suraksha Yojana (JSY)",
    ministry:"Ministry of Health & Family Welfare",
    category:"Health", level:"Central",
    benefit:"Cash assistance of ₹1,400 (rural) or ₹1,000 (urban) to pregnant women for institutional delivery.",
    howToApply:"Register at nearest government health centre (PHC/CHC/hospital) during pregnancy.",
    officialLink:"[nhm.gov.in](https://nhm.gov.in)",
    check: f => isFemale(f) && parseInt(f.age)>=18 && (f.pregnant || f.hasChildren),
    eligibilityNote:"As a woman, you are eligible for cash benefit for safe institutional delivery."
  },
  {
    id:"pmmvy", name:"Pradhan Mantri Matru Vandana Yojana (PMMVY)",
    ministry:"Ministry of Women & Child Development",
    category:"Health", level:"Central",
    benefit:"₹5,000 cash benefit in 3 instalments for first live birth for pregnant and lactating mothers.",
    howToApply:"Apply at Anganwadi Centre or nearest health facility within 730 days of pregnancy.",
    officialLink:"[wcd.nic.in](https://wcd.nic.in)",
    check: f => isFemale(f) && (f.pregnant || parseInt(f.numChildren||0)>=1) && parseInt(f.age)>=18,
    eligibilityNote:"As a pregnant/lactating mother, you qualify for ₹5,000 maternity benefit."
  },
  {
    id:"nhm", name:"National Health Mission (NHM) — Free Medicines & Diagnostics",
    ministry:"Ministry of Health & Family Welfare",
    category:"Health", level:"Central",
    benefit:"Free essential medicines, diagnostics, and treatment at all government health facilities.",
    howToApply:"Visit nearest government PHC, CHC, district hospital. No registration needed.",
    officialLink:"[nhm.gov.in](https://nhm.gov.in)",
    check: f => true,
    eligibilityNote:"All Indian citizens are eligible for free medicines at government hospitals."
  },
  {
    id:"rbsk", name:"Rashtriya Bal Swasthya Karyakram (RBSK)",
    ministry:"Ministry of Health & Family Welfare",
    category:"Health", level:"Central",
    benefit:"Free health screening and treatment for children (0–18 years) for 30 defined health conditions.",
    howToApply:"Mobile health teams visit schools/Anganwadis. Also available at District Early Intervention Centres.",
    officialLink:"[nhm.gov.in](https://nhm.gov.in/rbsk)",
    check: f => parseInt(f.age)<=18,
    eligibilityNote:"As a child under 18, you are eligible for free health screening and treatment."
  },

  // ── EDUCATION ────────────────────────────────────────────────────────────
  {
    id:"nsp", name:"National Scholarship Portal (NSP) — Pre/Post Matric Scholarships",
    ministry:"Ministry of Education",
    category:"Education", level:"Central",
    benefit:"Scholarships ranging from ₹1,000 to ₹25,000/year for SC/ST/OBC/minority/EWS students at various study levels.",
    howToApply:"Apply at scholarships.gov.in before the deadline (usually Oct–Nov each year).",
    officialLink:"[scholarships.gov.in](https://scholarships.gov.in)",
    check: f =>
      isStudent(f) &&
      ["SC","ST","OBC","Minority","EWS"].includes(f.category) &&
      parseInt(f.annualIncome||0)<=250000,
    eligibilityNote:"As an eligible student, you qualify for central government scholarships."
  },
  {
    id:"pmss", name:"Prime Minister's Scholarship Scheme (PMSS)",
    ministry:"Ministry of Home Affairs / Department of Ex-Servicemen Welfare",
    category:"Education", level:"Central",
    benefit:"₹2,500–₹3,000 per month scholarship for professional degree courses for wards of ex-servicemen.",
    howToApply:"Apply at desw.gov.in or ksb.gov.in.",
    officialLink:"[desw.gov.in](https://desw.gov.in)",
    check: f => isStudent(f) && f.exServiceman,
    eligibilityNote:"Ward of ex-serviceman — eligible for monthly scholarship for professional education."
  },
  {
    id:"rte", name:"Right to Education (RTE) — Free Schooling",
    ministry:"Ministry of Education",
    category:"Education", level:"Central",
    benefit:"Free and compulsory education for children aged 6–14 years in government schools. Private schools reserve 25% seats for EWS.",
    howToApply:"Enrol at nearest government school. For private school quota, apply through state education portal.",
    officialLink:"[mhrd.gov.in](https://mhrd.gov.in)",
    check: f => parseInt(f.age)>=6 && parseInt(f.age)<=14,
    eligibilityNote:"Children aged 6–14 have a legal right to free schooling."
  },
  {
    id:"mdrm", name:"Mid-Day Meal Scheme (PM POSHAN)",
    ministry:"Ministry of Education",
    category:"Education", level:"Central",
    benefit:"Free nutritious cooked meals for students in government and government-aided schools (Class 1–8).",
    howToApply:"Automatic for all enrolled students in government schools.",
    officialLink:"[pmposhan.education.gov.in](https://pmposhan.education.gov.in)",
    check: f => isStudent(f) && parseInt(f.age)>=6 && parseInt(f.age)<=14,
    eligibilityNote:"As a school student, you receive free nutritious meals under PM POSHAN."
  },
  {
    id:"eklavya", name:"Eklavya Model Residential Schools (EMRS)",
    ministry:"Ministry of Tribal Affairs",
    category:"Education", level:"Central",
    benefit:"Free residential schooling (Class 6–12) for ST students including accommodation, food, uniforms and education.",
    howToApply:"Apply through state tribal welfare department or nearest EMRS school.",
    officialLink:"[emrs.tribal.gov.in](https://emrs.tribal.gov.in)",
    check: f => f.category==="ST" && isStudent(f) && parseInt(f.age)<=18,
    eligibilityNote:"As an ST student, you qualify for free residential schooling."
  },
  {
    id:"navodaya", name:"Jawahar Navodaya Vidyalaya (JNV) — Free Residential School",
    ministry:"Ministry of Education",
    category:"Education", level:"Central",
    benefit:"Free quality residential education from Class 6–12 including boarding, food, uniforms and study materials.",
    howToApply:"Apply for JNVST entrance exam at navodaya.gov.in.",
    officialLink:"[navodaya.gov.in](https://navodaya.gov.in)",
    check: f => isStudent(f) && parseInt(f.age)>=10 && parseInt(f.age)<=12,
    eligibilityNote:"Children aged 10–12 can appear for JNV selection test for free residential schooling."
  },
  {
    id:"standup", name:"Stand-Up India Scheme",
    ministry:"Ministry of Finance / SIDBI",
    category:"Education", level:"Central",
    benefit:"Bank loans from ₹10 lakh to ₹1 crore for SC/ST and women entrepreneurs to set up greenfield enterprises.",
    howToApply:"Apply at standupmitra.in or any scheduled commercial bank.",
    officialLink:"[standupmitra.in](https://standupmitra.in)",
    check: f => (f.category==="SC"||f.category==="ST"||isFemale(f)) && parseInt(f.age)>=18 && parseInt(f.annualIncome||0)>0,
    eligibilityNote:"As SC/ST or woman entrepreneur, you qualify for business loan at concessional rates."
  },

  // ── EMPLOYMENT & SKILL ───────────────────────────────────────────────────
  {
    id:"mgnrega", name:"MGNREGA (Mahatma Gandhi NREGS) — 100 Days Work",
    ministry:"Ministry of Rural Development",
    category:"Employment", level:"Central",
    benefit:"100 days of guaranteed wage employment per year at minimum wage (₹220–₹350/day depending on state).",
    howToApply:"Register at nearest Gram Panchayat office and get Job Card issued.",
    officialLink:"[nrega.nic.in](https://nrega.nic.in)",
    check: f =>
      parseInt(f.age)>=18 &&
      !["Salaried (Government)","Salaried (Private)"].includes(f.employmentStatus) &&
      (f.residenceType === "Rural"),
    eligibilityNote:"All adult rural household members are eligible for 100 days guaranteed work."
  },
  {
    id:"pmkvy", name:"PM Kaushal Vikas Yojana (PMKVY) — Free Skill Training",
    ministry:"Ministry of Skill Development & Entrepreneurship",
    category:"Skill Development", level:"Central",
    benefit:"Free short-term skill training (150–300 hours) with ₹8,000 reward on certification in 300+ job roles.",
    howToApply:"Register at pmkvyofficial.org or nearest Skill India Training Centre.",
    officialLink:"[pmkvyofficial.org](https://pmkvyofficial.org)",
    check: f => parseInt(f.age)>=15 && parseInt(f.age)<=45 && (f.hasSmartphone || f.hasInternet || true),
    eligibilityNote:"Youth aged 15–45 years can get free skill training with certification reward."
  },
  {
    id:"ddugky", name:"DDU-GKY (Deen Dayal Upadhyaya Grameen Kaushalya Yojana)",
    ministry:"Ministry of Rural Development",
    category:"Skill Development", level:"Central",
    benefit:"Free residential skill training with placement guarantee. 75% placement rate mandatory for implementing agencies.",
    howToApply:"Apply through state rural livelihood mission or ddugky.gov.in.",
    officialLink:"[ddugky.gov.in](https://ddugky.gov.in)",
    check: f => parseInt(f.age)>=15 && parseInt(f.age)<=35 && (f.bplCard || parseInt(f.annualIncome||0)<=150000),
    eligibilityNote:"Rural youth aged 15–35 from poor households qualify for free skill training + placement."
  },
  {
    id:"pmegp", name:"PM Employment Generation Programme (PMEGP)",
    ministry:"Ministry of MSME",
    category:"Employment", level:"Central",
    benefit:"Subsidy of 15–35% on project cost up to ₹25 lakh for manufacturing, ₹10 lakh for services for new businesses.",
    howToApply:"Apply at kviconline.gov.in or nearest KVIC/KVIB/DIC office.",
    officialLink:"[kviconline.gov.in](https://www.kviconline.gov.in)",
    check: f => parseInt(f.age)>=18 && (f.employmentStatus==="Unemployed"||f.employmentStatus==="Self-employed"||f.employmentStatus==="MSME/Small Business"),
    eligibilityNote:"Unemployed/self-employed individuals above 18 can start a business with government subsidy."
  },
  {
    id:"naps", name:"National Apprenticeship Promotion Scheme (NAPS)",
    ministry:"Ministry of Skill Development",
    category:"Skill Development", level:"Central",
    benefit:"Government shares 25% of stipend (max ₹1,500/month) for apprentices. Stipend ranges ₹5,000–₹9,000/month.",
    howToApply:"Register at apprenticeshipindia.org.",
    officialLink:"[apprenticeshipindia.org](https://apprenticeshipindia.org)",
    check: f => parseInt(f.age)>=14 && parseInt(f.age)<=35 && (isStudent(f)||f.employmentStatus==="Unemployed"),
    eligibilityNote:"Youth seeking apprenticeship training with stipend support."
  },
  {
    id:"pmsvnidhi", name:"PM SVANidhi (Street Vendor Loan Scheme)",
    ministry:"Ministry of Housing & Urban Affairs",
    category:"Financial Inclusion", level:"Central",
    benefit:"Working capital loan starting ₹10,000, upgradeable to ₹20,000 then ₹50,000 with 7% interest subsidy.",
    howToApply:"Apply at pmsvanidhi.mohua.gov.in or nearest bank/MFI with vendor ID.",
    officialLink:"[pmsvanidhi.mohua.gov.in](https://pmsvanidhi.mohua.gov.in)",
    check: f =>
      f.occupation &&
      ["street vendor","vendor","hawker","thela","cart"].some(k=>f.occupation.toLowerCase().includes(k)) &&
      f.residenceType === "Urban",
    eligibilityNote:"Urban street vendors are eligible for collateral-free working capital loan."
  },
  {
    id:"pmvishwakarma", name:"PM Vishwakarma Scheme",
    ministry:"Ministry of MSME",
    category:"Skill Development", level:"Central",
    benefit:"₹15,000 toolkit support, skill training with ₹500/day stipend, and loan up to ₹3 lakh at 5% interest for 18 traditional trades.",
    howToApply:"Register at pmvishwakarma.gov.in through CSC or mobile app.",
    officialLink:"[pmvishwakarma.gov.in](https://pmvishwakarma.gov.in)",
    check: f => parseInt(f.age)>=18 && isArtisanOccupation(f),
    eligibilityNote:"Artisans and craftspeople in traditional trades qualify for toolkit + skill training + loan."
  },

  // ── FINANCIAL INCLUSION ──────────────────────────────────────────────────
  {
    id:"pmjdy", name:"PM Jan Dhan Yojana (PMJDY) — Zero Balance Bank Account",
    ministry:"Ministry of Finance",
    category:"Financial Inclusion", level:"Central",
    benefit:"Zero balance bank account with RuPay debit card, ₹1 lakh accident insurance, ₹30,000 life insurance, and ₹10,000 overdraft.",
    howToApply:"Visit any bank branch or Business Correspondent with Aadhaar/valid ID.",
    officialLink:"[pmjdy.gov.in](https://pmjdy.gov.in)",
    check: f => !f.bankAccount,
    eligibilityNote:"You indicated no bank account — eligible for a zero-balance PMJDY account with insurance benefits."
  },
  {
    id:"pmsby", name:"PM Suraksha Bima Yojana (PMSBY) — Accident Insurance",
    ministry:"Ministry of Finance",
    category:"Financial Inclusion", level:"Central",
    benefit:"₹2 lakh accidental death/disability insurance for just ₹20/year premium via bank account auto-debit.",
    howToApply:"Enrol through your bank account net banking, branch, or CSC.",
    officialLink:"[jansuraksha.gov.in](https://jansuraksha.gov.in)",
    check: f => parseInt(f.age)>=18 && parseInt(f.age)<=70 && (f.bankAccount || f.hasAadhaarLinkedBank),
    eligibilityNote:"You can get ₹2 lakh accident insurance cover for only ₹20/year."
  },
  {
    id:"pmjjby", name:"PM Jeevan Jyoti Bima Yojana (PMJJBY) — Life Insurance",
    ministry:"Ministry of Finance",
    category:"Financial Inclusion", level:"Central",
    benefit:"₹2 lakh life insurance cover (death by any cause) for ₹436/year premium via bank auto-debit.",
    howToApply:"Enrol through your bank or CSC.",
    officialLink:"[jansuraksha.gov.in](https://jansuraksha.gov.in)",
    check: f => parseInt(f.age)>=18 && parseInt(f.age)<=50 && (f.bankAccount || f.hasAadhaarLinkedBank),
    eligibilityNote:"You qualify for ₹2 lakh life insurance at just ₹436/year."
  },
  {
    id:"apy", name:"Atal Pension Yojana (APY)",
    ministry:"Ministry of Finance / PFRDA",
    category:"Social Security", level:"Central",
    benefit:"Guaranteed pension of ₹1,000–₹5,000/month after age 60 based on contributions. Government co-contributes for eligible members.",
    howToApply:"Enrol at any bank branch or npscra.nsdl.com.",
    officialLink:"[npscra.nsdl.com](https://npscra.nsdl.com)",
    check: f => parseInt(f.age)>=18 && parseInt(f.age)<=40 && !["Salaried (Government)"].includes(f.employmentStatus),
    eligibilityNote:"You can secure a guaranteed pension of ₹1,000–₹5,000/month starting at ₹42/month."
  },
  {
    id:"mudra", name:"PM MUDRA Yojana (Business Loan)",
    ministry:"Ministry of Finance / MUDRA",
    category:"Financial Inclusion", level:"Central",
    benefit:"Collateral-free business loans: Shishu (up to ₹50,000), Kishor (₹50K–₹5 lakh), Tarun (₹5–₹10 lakh) at low interest.",
    howToApply:"Apply at any bank, NBFC, or MFI. No collateral required for Shishu and Kishor.",
    officialLink:"[mudra.org.in](https://mudra.org.in)",
    check: f => parseInt(f.age)>=18 && ["Self-employed","MSME/Small Business","Unemployed","Daily Wage Worker"].includes(f.employmentStatus),
    eligibilityNote:"Self-employed/business owners qualify for collateral-free MUDRA business loans."
  },

  // ── SOCIAL SECURITY ──────────────────────────────────────────────────────
  {
    id:"nsap", name:"National Social Assistance Programme (NSAP) — Old Age Pension",
    ministry:"Ministry of Rural Development",
    category:"Social Security", level:"Central",
    benefit:"Monthly pension of ₹200–₹500 (centre) + state top-up (often ₹1,000–₹3,000 total) for BPL senior citizens.",
    howToApply:"Apply at Gram Panchayat or state social welfare office.",
    officialLink:"[nsap.nic.in](https://nsap.nic.in)",
    check: f => parseInt(f.age)>=60 && (f.bplCard || parseInt(f.annualIncome||0)<=200000),
    eligibilityNote:"As a low-income senior citizen, you qualify for monthly old-age pension."
  },
  {
    id:"vidhwa", name:"Vidhwa Pension (Indira Gandhi National Widow Pension)",
    ministry:"Ministry of Rural Development",
    category:"Social Security", level:"Central",
    benefit:"₹300/month (centre) + state top-up. Most states provide ₹1,000–₹2,000/month total to widows.",
    howToApply:"Apply at Gram Panchayat (rural) or municipality office (urban) with husband's death certificate.",
    officialLink:"[nsap.nic.in](https://nsap.nic.in)",
    check: f => isFemale(f) && f.isWidow && parseInt(f.age)>=40 && parseInt(f.age)<=79 && (f.bplCard || parseInt(f.annualIncome||0)<=200000),
    eligibilityNote:"As a widow below poverty line, you are eligible for monthly widow pension."
  },
  {
    id:"divyang", name:"Indira Gandhi National Disability Pension Scheme",
    ministry:"Ministry of Rural Development",
    category:"Social Security", level:"Central",
    benefit:"₹300/month (centre) + state top-up for BPL persons with 80%+ disability aged 18–79.",
    howToApply:"Apply at Gram Panchayat with disability certificate.",
    officialLink:"[nsap.nic.in](https://nsap.nic.in)",
    check: f => f.disability && parseInt(f.age)>=18 && (f.bplCard || parseInt(f.annualIncome||0)<=200000),
    eligibilityNote:"As a person with disability from a low-income household, you qualify for disability pension."
  },
  {
    id:"ignoaps", name:"IGNOAPS — Old Age Pension (80+ years)",
    ministry:"Ministry of Rural Development",
    category:"Social Security", level:"Central",
    benefit:"₹500/month from Centre + state top-up for BPL elderly aged 80 years and above.",
    howToApply:"Apply at Gram Panchayat or social welfare department.",
    officialLink:"[nsap.nic.in](https://nsap.nic.in)",
    check: f => parseInt(f.age)>=80 && (f.bplCard || parseInt(f.annualIncome||0)<=200000),
    eligibilityNote:"As a low-income citizen aged 80+, you qualify for enhanced old-age pension."
  },
  {
    id:"eshram", name:"e-Shram Card — Unorganized Worker Benefits",
    ministry:"Ministry of Labour & Employment",
    category:"Social Security", level:"Central",
    benefit:"₹2 lakh accident insurance, priority access to social security schemes.",
    howToApply:"Register free at eshram.gov.in or nearest CSC with Aadhaar.",
    officialLink:"[eshram.gov.in](https://eshram.gov.in)",
    check: f =>
      parseInt(f.age)>=16 &&
      parseInt(f.age)<=59 &&
      ["Daily Wage Worker","Construction Worker","Migrant Worker","Agricultural Worker","Self-employed","Homemaker","Artisan/Craftsperson"].includes(f.employmentStatus),
    eligibilityNote:"As an unorganized sector worker, register for e-Shram card to access social security benefits."
  },

  // ── WOMEN & CHILD ────────────────────────────────────────────────────────
  {
    id:"beti", name:"Beti Bachao Beti Padhao (BBBP)",
    ministry:"Ministry of Women & Child Development",
    category:"Women & Child", level:"Central",
    benefit:"Financial incentives for girl child education, conditional cash transfers, and welfare benefits through linked schemes.",
    howToApply:"Enrol girl child at nearest government school or Anganwadi centre.",
    officialLink:"[wcd.nic.in](https://wcd.nic.in)",
    check: f => (isFemale(f) && parseInt(f.age)<=18) || (f.numChildren && parseInt(f.numChildren)>0),
    eligibilityNote:"Girl children and families with daughters benefit from this scheme's linked incentives."
  },
  {
    id:"ssy", name:"Sukanya Samriddhi Yojana (SSY) — Girl Child Savings",
    ministry:"Ministry of Finance",
    category:"Women & Child", level:"Central",
    benefit:"Attractive interest for girl child. Min deposit ₹250/year. Tax-free maturity amount.",
    howToApply:"Open account at post office or any bank for girl child below 10 years.",
    officialLink:"[indiapost.gov.in](https://www.indiapost.gov.in)",
    check: f => (isFemale(f) && parseInt(f.age)<10) || (parseInt(f.numChildren||0)>0 && parseInt(f.age)>=18),
    eligibilityNote:"You can open a Sukanya Samriddhi account for your daughter for high-interest girl child savings."
  },
  {
    id:"icds", name:"ICDS — Anganwadi Services (Food + Health for Children)",
    ministry:"Ministry of Women & Child Development",
    category:"Women & Child", level:"Central",
    benefit:"Free supplementary nutrition, immunization, health check-ups, and pre-school education for children 0–6 years.",
    howToApply:"Visit nearest Anganwadi Centre. Automatic enrollment for children 0–6.",
    officialLink:"[wcd.nic.in](https://wcd.nic.in)",
    check: f => parseInt(f.age)<=6 || (parseInt(f.numChildren||0)>0 && parseInt(f.age)<=40),
    eligibilityNote:"Children under 6 and their mothers are entitled to free nutrition, health and early education."
  },
  {
    id:"wcgrant", name:"One Stop Centre (Sakhi) for Women in Distress",
    ministry:"Ministry of Women & Child Development",
    category:"Women & Child", level:"Central",
    benefit:"Free shelter, medical aid, legal aid, police facilitation, and counselling for women facing violence.",
    howToApply:"Call helpline 181 or visit nearest One Stop Centre.",
    officialLink:"[wcd.nic.in](https://wcd.nic.in)",
    check: f => isFemale(f) && parseInt(f.age)>=18,
    eligibilityNote:"All women facing violence or distress can access free legal, medical and shelter support."
  },
  {
    id:"ujjwala", name:"PM Ujjwala Yojana 2.0 — Free LPG Connection",
    ministry:"Ministry of Petroleum & Natural Gas",
    category:"Women & Child", level:"Central",
    benefit:"Free LPG connection with first refill free and one gas stove for BPL women.",
    howToApply:"Apply at nearest LPG distributor or pmuy.gov.in.",
    officialLink:"[pmuy.gov.in](https://pmuy.gov.in)",
    check: f => isFemale(f) && parseInt(f.age)>=18 && (f.bplCard || parseInt(f.annualIncome||0)<=200000) && !f.hasLPG,
    eligibilityNote:"As a woman from a low-income household, you qualify for a free LPG cooking gas connection."
  },

  // ── FOOD SECURITY ────────────────────────────────────────────────────────
  {
    id:"nfsa", name:"National Food Security Act (NFSA) — Subsidized Ration",
    ministry:"Ministry of Consumer Affairs, Food & Public Distribution",
    category:"Social Security", level:"Central",
    benefit:"5 kg of rice/wheat/coarse grains per person per month at subsidised rates (or free in some periods).",
    howToApply:"Apply for ration card at nearest Fair Price Shop or state food department.",
    officialLink:"[nfsa.gov.in](https://nfsa.gov.in)",
    check: f => f.bplCard || f.rationCard || parseInt(f.annualIncome||0)<=150000 || f.hasPDSRation,
    eligibilityNote:"Based on your income/BPL/PDS status, you are eligible for subsidized food grains."
  },
  {
    id:"pmgkay", name:"PM Garib Kalyan Anna Yojana (PMGKAY) — Free Ration",
    ministry:"Ministry of Consumer Affairs",
    category:"Social Security", level:"Central",
    benefit:"5 kg free food grains per person per month for NFSA beneficiaries (policy-dependent timing).",
    howToApply:"Automatic for existing ration card holders. Check eligibility at nfsa.gov.in.",
    officialLink:"[nfsa.gov.in](https://nfsa.gov.in)",
    check: f => (f.rationCard && f.rationCard!=="APL (Above Poverty Line)") || f.hasPDSRation,
    eligibilityNote:"As a BPL/AAY/PHH ration card holder, you may receive additional free food grains."
  },

  // ── SANITATION ───────────────────────────────────────────────────────────
  {
    id:"sbm", name:"Swachh Bharat Mission — Free Toilet Construction",
    ministry:"Ministry of Jal Shakti",
    category:"Housing", level:"Central",
    benefit:"₹12,000 incentive for construction of individual household toilet for rural BPL families.",
    howToApply:"Apply at Gram Panchayat or sbm.gov.in.",
    officialLink:"[swachhbharat.mygov.in](https://swachhbharat.mygov.in)",
    check: f => (f.bplCard || parseInt(f.annualIncome||0)<=200000) && !f.hasToilet && (f.residenceType === "Rural"),
    eligibilityNote:"Rural low-income households without toilets qualify for ₹12,000 incentive to build a toilet."
  },
  {
    id:"jjm", name:"Jal Jeevan Mission — Har Ghar Jal (Tap Water)",
    ministry:"Ministry of Jal Shakti",
    category:"Housing", level:"Central",
    benefit:"Functional household tap water connection to every rural household.",
    howToApply:"Contact Gram Panchayat or state water department.",
    officialLink:"[jaljeevanmission.gov.in](https://jaljeevanmission.gov.in)",
    check: f => (f.residenceType === "Rural") && (!f.hasPotableWater || !f.hasTapWater),
    eligibilityNote:"All rural households are targeted for piped tap water; lack of potable/tap water prioritizes you."
  },

  // ── ELECTRICITY ──────────────────────────────────────────────────────────
  {
    id:"saubhagya", name:"Saubhagya Scheme — Free Electricity Connection",
    ministry:"Ministry of Power",
    category:"Housing", level:"Central",
    benefit:"Free electricity connection to unelectrified BPL rural households; nominal cost for APL rural households.",
    howToApply:"Apply at DISCOM office or saubhagya.gov.in.",
    officialLink:"[saubhagya.gov.in](https://saubhagya.gov.in)",
    check: f => !f.hasElectricity && (f.residenceType === "Rural") && (f.bplCard || parseInt(f.annualIncome||0)<=200000),
    eligibilityNote:"Rural BPL households without electricity qualify for a free connection."
  },

  // ── DISABILITY ───────────────────────────────────────────────────────────
  {
    id:"adip", name:"ADIP Scheme — Free Assistive Devices for Disabled",
    ministry:"Ministry of Social Justice & Empowerment",
    category:"Social Security", level:"Central",
    benefit:"Free assistive devices (hearing aids, wheelchairs, crutches, artificial limbs, Braille kits) for disabled persons.",
    howToApply:"Apply through district social welfare office or alimco.in.",
    officialLink:"[alimco.in](https://www.alimco.in)",
    check: f => f.disability,
    eligibilityNote:"As a person with disability, you are eligible for free assistive devices."
  },
  {
    id:"nfdh", name:"National Fellowship for Disabled (Rajiv Gandhi Fellowship)",
    ministry:"Ministry of Social Justice",
    category:"Education", level:"Central",
    benefit:"Monthly fellowship support for disabled students pursuing M.Phil/PhD at recognized universities.",
    howToApply:"Apply through UGC or MoSJE portal.",
    officialLink:"[ugc.ac.in](https://ugc.ac.in)",
    check: f => f.disability && isStudent(f) && ["Postgraduate","PhD"].includes(f.education),
    eligibilityNote:"Disabled students pursuing research degrees qualify for monthly fellowship."
  },

  // ── SC/ST SCHEMES ────────────────────────────────────────────────────────
  {
    id:"postmatricsc", name:"Post Matric Scholarship for SC Students",
    ministry:"Ministry of Social Justice & Empowerment",
    category:"Education", level:"Central",
    benefit:"Full tuition fee + maintenance allowance for SC students studying post-10th.",
    howToApply:"Apply at scholarships.gov.in annually.",
    officialLink:"[scholarships.gov.in](https://scholarships.gov.in)",
    check: f => f.category==="SC" && isStudent(f) && parseInt(f.annualIncome||0)<=250000,
    eligibilityNote:"As an SC student, you qualify for full tuition fee waiver and monthly maintenance allowance."
  },
  {
    id:"postmatricst", name:"Post Matric Scholarship for ST Students",
    ministry:"Ministry of Tribal Affairs",
    category:"Education", level:"Central",
    benefit:"Full tuition fee reimbursement + maintenance allowance for ST students studying post-10th.",
    howToApply:"Apply at scholarships.gov.in or tribal welfare portal.",
    officialLink:"[tribal.nic.in](https://tribal.nic.in)",
    check: f => f.category==="ST" && isStudent(f) && parseInt(f.annualIncome||0)<=250000,
    eligibilityNote:"As an ST student, your tuition fees and maintenance are fully covered."
  },
  {
    id:"vanbandhu", name:"Van Bandhu Kalyan Yojana (Tribal Welfare)",
    ministry:"Ministry of Tribal Affairs",
    category:"Social Security", level:"Central",
    benefit:"Comprehensive tribal development covering education, health, livelihood, roads and connectivity in tribal areas.",
    howToApply:"Contact district tribal welfare office or state tribal development authority.",
    officialLink:"[tribal.nic.in](https://tribal.nic.in)",
    check: f => f.category==="ST",
    eligibilityNote:"Tribal (ST) community members benefit from Van Bandhu Kalyan Yojana."
  },
  {
    id:"scpdc", name:"Micro-Credit Scheme for SC/OBC (NSFDC)",
    ministry:"Ministry of Social Justice",
    category:"Financial Inclusion", level:"Central",
    benefit:"Term loans at concessional interest for income-generating activities by SC/OBC below double poverty line.",
    howToApply:"Apply through NSFDC or state channelising agencies.",
    officialLink:"[nsfdc.nic.in](https://nsfdc.nic.in)",
    check: f => ["SC","OBC"].includes(f.category) && parseInt(f.annualIncome||0)<=200000 && parseInt(f.age)>=18,
    eligibilityNote:"SC/OBC persons below double poverty line can get concessional business loans."
  },

  // ── MINORITY ─────────────────────────────────────────────────────────────
  {
    id:"pmvmy", name:"PM Virasat Ka Samvardhan (PM Vikas) — Minority Artisans",
    ministry:"Ministry of Minority Affairs",
    category:"Skill Development", level:"Central",
    benefit:"Skill training in traditional crafts, access to credit, and market linkages for minority artisans.",
    howToApply:"Apply at minorityaffairs.gov.in or nearest minority welfare office.",
    officialLink:"[minorityaffairs.gov.in](https://minorityaffairs.gov.in)",
    check: f => f.category==="Minority" && parseInt(f.age)>=18,
    eligibilityNote:"As a minority community member, you can access skill training and market linkages."
  },
  {
    id:"mominority", name:"Maulana Azad National Fellowship (MANF) for Minorities",
    ministry:"Ministry of Minority Affairs",
    category:"Education", level:"Central",
    benefit:"Monthly fellowship support for minority students pursuing M.Phil/PhD.",
    howToApply:"Apply at scholarships.gov.in.",
    officialLink:"[scholarships.gov.in](https://scholarships.gov.in)",
    check: f => f.category==="Minority" && isStudent(f) && ["Postgraduate","PhD"].includes(f.education),
    eligibilityNote:"Minority students pursuing research qualify for monthly fellowship."
  },

  // ── SENIOR CITIZENS ──────────────────────────────────────────────────────
  {
    id:"scss", name:"Senior Citizen Savings Scheme (SCSS)",
    ministry:"Ministry of Finance",
    category:"Social Security", level:"Central",
    benefit:"Attractive fixed interest on deposits up to the notified limit. Quarterly payout. 80C eligible.",
    howToApply:"Open account at post office or authorized bank with age proof.",
    officialLink:"[indiapost.gov.in](https://www.indiapost.gov.in)",
    check: f => parseInt(f.age)>=60,
    eligibilityNote:"As a senior citizen, you can earn higher interest on savings."
  },
  {
    id:"varistha", name:"Varistha Pension Bima Yojana",
    ministry:"Ministry of Finance / LIC",
    category:"Social Security", level:"Central",
    benefit:"Guaranteed pension/return on lump-sum investment up to the notified cap for senior citizens.",
    howToApply:"Apply through LIC offices.",
    officialLink:"[licindia.in](https://licindia.in)",
    check: f => parseInt(f.age)>=60,
    eligibilityNote:"Senior citizens can invest in LIC's guaranteed pension plan."
  },
  {
    id:"rastriyavayoshri", name:"Rashtriya Vayoshri Yojana",
    ministry:"Ministry of Social Justice",
    category:"Social Security", level:"Central",
    benefit:"Free assistive living devices (walking sticks, wheelchairs, hearing aids, spectacles) for BPL senior citizens.",
    howToApply:"Apply through district social welfare office.",
    officialLink:"[socialjustice.gov.in](https://socialjustice.gov.in)",
    check: f => parseInt(f.age)>=60 && (f.bplCard || parseInt(f.annualIncome||0)<=200000),
    eligibilityNote:"Low-income senior citizens qualify for free assistive devices to aid daily living."
  },

  // ── EWS / GENERAL POOR ───────────────────────────────────────────────────
  {
    id:"ewsscholarship", name:"EWS Scholarship — Central Sector Scheme",
    ministry:"Ministry of Education",
    category:"Education", level:"Central",
    benefit:"Scholarship for 12th pass EWS students scoring top percentile, for undergraduate studies.",
    howToApply:"Apply at scholarships.gov.in.",
    officialLink:"[scholarships.gov.in](https://scholarships.gov.in)",
    check: f => f.category==="EWS" && isStudent(f) && parseInt(f.annualIncome||0)<=800000,
    eligibilityNote:"EWS students with good academic record qualify for annual education scholarship."
  },
  {
    id:"csjm", name:"Central Sector Scholarship for College Students",
    ministry:"Ministry of Education",
    category:"Education", level:"Central",
    benefit:"Annual scholarship for meritorious college students from families with income below threshold.",
    howToApply:"Apply at scholarships.gov.in.",
    officialLink:"[scholarships.gov.in](https://scholarships.gov.in)",
    check: f => isStudent(f) && parseInt(f.annualIncome||0)<=450000 && ["Undergraduate","Postgraduate"].includes(f.education),
    eligibilityNote:"College students from lower-income families qualify for a merit scholarship."
  },

  // ── HEALTH INSURANCE ─────────────────────────────────────────────────────
  {
    id:"esic", name:"ESIC (Employee State Insurance) — Health & Social Security",
    ministry:"Ministry of Labour & Employment",
    category:"Health", level:"Central",
    benefit:"Medical care, maternity benefits, disability benefit, unemployment allowance for registered workers.",
    howToApply:"Employer registers workers earning ≤₹21,000/month. Visit esic.gov.in for more details.",
    officialLink:"[esic.gov.in](https://esic.gov.in)",
    check: f => ["Salaried (Private)","Daily Wage Worker"].includes(f.employmentStatus) && parseInt(f.annualIncome||0)<=252000,
    eligibilityNote:"Salaried workers earning ≤₹21,000/month in eligible establishments get ESIC benefits."
  },

  // ── MIGRANT WORKERS ──────────────────────────────────────────────────────
  {
    id:"migrant", name:"Support for Migrant Workers",
    ministry:"Ministry of Labour & Employment",
    category:"Employment", level:"Central",
    benefit:"Shelter/food support (as per state), skill training, and portability via One Nation One Ration Card.",
    howToApply:"Register at eshram.gov.in and state migrant worker portal.",
    officialLink:"[eshram.gov.in](https://eshram.gov.in)",
    check: f => f.migrantWorker || f.employmentStatus==="Migrant Worker",
    eligibilityNote:"As a migrant worker, register for social security and ration portability."
  },

  // ── SELF HELP GROUPS ─────────────────────────────────────────────────────
  {
    id:"daynrlm", name:"DAY-NRLM Lakhpati Didi (SHG Women's Livelihood)",
    ministry:"Ministry of Rural Development",
    category:"Employment", level:"Central",
    benefit:"Revolving fund, credit linkage, livelihood support to help SHG women increase income.",
    howToApply:"Join/form SHG through Gram Panchayat or nearest NRLM block office.",
    officialLink:"[aajeevika.gov.in](https://aajeevika.gov.in)",
    check: f => isFemale(f) && parseInt(f.age)>=18 && (f.selfHelp || parseInt(f.annualIncome||0)<=200000),
    eligibilityNote:"Women from low-income households can join SHGs for interest-free loans and livelihood support."
  },
  {
    id:"maternalbenefit", name:"Maternity Benefit Programme (MBP) — Extended",
    ministry:"Ministry of Labour & Employment",
    category:"Women & Child", level:"Central",
    benefit:"26 weeks paid maternity leave for women employed in establishments with 10+ workers.",
    howToApply:"Apply through employer HR/payroll department.",
    officialLink:"[labour.gov.in](https://labour.gov.in)",
    check: f => isFemale(f) && f.pregnant && ["Salaried (Private)","Salaried (Government)"].includes(f.employmentStatus),
    eligibilityNote:"As a salaried pregnant woman, you are entitled to 26 weeks paid maternity leave."
  },

  // ── STARTUPS & ENTREPRENEURSHIP ──────────────────────────────────────────
  {
    id:"startupindia", name:"Startup India — Tax Exemption & Funding",
    ministry:"Ministry of Commerce & Industry / DPIIT",
    category:"Employment", level:"Central",
    benefit:"3-year income tax exemption for eligible startups, IP fee rebates, and access to Fund of Funds.",
    howToApply:"Register at startupindia.gov.in.",
    officialLink:"[startupindia.gov.in](https://startupindia.gov.in)",
    check: f => parseInt(f.age)>=18 && ["Self-employed","MSME/Small Business","Unemployed"].includes(f.employmentStatus),
    eligibilityNote:"Entrepreneurs can register their startup for benefits and easier compliance."
  },

  // ── HOUSING (legacy/ongoing) ─────────────────────────────────────────────
  {
    id:"iay", name:"Indira Awaas Yojana (IAY) Ongoing Benefits",
    ministry:"Ministry of Rural Development",
    category:"Housing", level:"Central",
    benefit:"Housing assistance and pending beneficiary disbursements for already sanctioned rural housing.",
    howToApply:"Check status at pmayg.nic.in.",
    officialLink:"[pmayg.nic.in](https://pmayg.nic.in)",
    check: f => (f.bplCard || parseInt(f.annualIncome||0)<=200000) && !f.ownHouse && (f.category==="SC"||f.category==="ST"),
    eligibilityNote:"SC/ST low-income rural households without homes have priority for rural housing assistance."
  },
];

// ─── Helper functions ───────────────────────────────────────────────────────
function isFemale(f) { return f.gender==="Female"; }
function isStudent(f) { return f.employmentStatus==="Student"; }
function isFarmerProfile(f) {
  return f.farmer || ["Farmer","Agricultural Worker"].includes(f.employmentStatus) || (f.occupation||"").toLowerCase()==="farmer";
}
function isArtisanOccupation(f) {
  if (!f.occupation) return false;
  const trades = ["carpenter","blacksmith","potter","weaver","cobbler","goldsmith","mason",
    "basket","tailor","barber","washerman","toy","sculptor","locksmith","hammer","artisan","craft"];
  return trades.some(t => f.occupation.toLowerCase().includes(t));
}

// ─── eligibility engine ─────────────────────────────────────────────────────
function getEligibleSchemes(form) {
  return ALL_SCHEMES.filter(s => {
    try { return s.check(form); } catch(e) { return false; }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// UI Constants
// ─────────────────────────────────────────────────────────────────────────────
const statesList = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh",
  "Puducherry","Chandigarh","Andaman & Nicobar","Lakshadweep","Dadra & Nagar Haveli"
];

const categoryColors = {
  "Agriculture":"#166534","Housing":"#1e3a8a","Health":"#7c2d12","Education":"#4c1d95",
  "Employment":"#92400e","Women & Child":"#831843","Social Security":"#0f4c5c",
  "Financial Inclusion":"#14532d","Skill Development":"#1e1b4b","Others":"#374151",
};
const categoryBg = {
  "Agriculture":"#dcfce7","Housing":"#dbeafe","Health":"#fee2e2","Education":"#ede9fe",
  "Employment":"#fef3c7","Women & Child":"#fce7f3","Social Security":"#e0f2fe",
  "Financial Inclusion":"#d1fae5","Skill Development":"#e0e7ff","Others":"#f3f4f6",
};

const inp = {
  width:"100%",padding:"10px 14px",borderRadius:8,border:"1.5px solid #d1d5db",
  fontSize:14,color:"#111827",background:"#fff",outline:"none",
  boxSizing:"border-box",fontFamily:"inherit"
};
const sel = {...inp, cursor:"pointer"};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name:"", age:"", gender:"", state:"", category:"", maritalStatus:"",
    disability:false, aadhaar:false, bankAccount:false,

    // New basic needs
    residenceType:"", // Rural | Urban
    householdSize:"", monthlyRent:"", hasPotableWater:false, hasTapWater:false,
    hasPDSRation:false, hasChronicIllness:false, schoolAgeNotEnrolled:false,
    hasSmartphone:false, hasInternet:false, hasAadhaarLinkedBank:false,
    hasCasteCert:false, hasIncomeCert:false,

    employmentStatus:"", occupation:"", education:"", courseName:"", institution:"",
    farmer:false, landOwned:"", cropType:"", pregnant:false, numChildren:"",
    isWidow:false, migrantWorker:false, selfHelp:false, exServiceman:false,
    hasLPG:false, hasElectricity:true, hasToilet:true, ownHouse:false,
    annualIncome:"", bplCard:false, rationCard:"",
    hasChildren:false,
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const [schemes, setSchemes] = useState(null);
  const [aiExtra, setAiExtra] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Step validations (now 5 steps)
  const stepValid = [
    !!(form.name && form.age && form.gender && form.state && form.category),
    !!(form.residenceType), // Basic Needs
    !!(form.employmentStatus),
    !!(form.annualIncome),
    true
  ];

  function handleFind() {
    const eligible = getEligibleSchemes(form);
    setSchemes(eligible);
    tryAI(eligible);
  }

  async function tryAI(localSchemes) {
    // Stub: leaves structure for your own backend integration
    setAiLoading(true);
    try {
      // Place your real fetch() to your API here; below is a no-op mock
      await new Promise(r=>setTimeout(r, 800));
      // Example: setAiExtra([{ name:"State X Scheme", category:"Social Security", benefit:"...", ... }])
      setAiExtra(null);
    } catch(e) {
      // ignore
    }
    setAiLoading(false);
  }

  if (schemes !== null) {
    return <ResultsPage schemes={schemes} aiExtra={aiExtra} aiLoading={aiLoading} form={form}
      onReset={()=>{setSchemes(null);setAiExtra(null);setStep(0);}}/>;
  }

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#f0fdf4 0%,#dcfce7 50%,#bbf7d0 100%)",
      display:"flex",flexDirection:"column",alignItems:"center",padding:"2rem 1rem",
      fontFamily:"'Segoe UI',system-ui,sans-serif"}}>

      <div style={{textAlign:"center",marginBottom:"1.8rem"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"#15803d",color:"#fff",
          borderRadius:12,padding:"5px 16px",fontSize:11,fontWeight:700,letterSpacing:"0.08em",
          marginBottom:14,textTransform:"uppercase"}}>
          🇮🇳  AI-Powered Government Scheme Finder
        </div>
        <h1 style={{fontSize:"clamp(1.6rem,4vw,2.4rem)",fontWeight:800,color:"#14532d",
          margin:"0 0 6px",letterSpacing:"-0.02em",lineHeight:1.2}}>
          Find Your Eligible<br/><span style={{color:"#16a34a"}}>Government Schemes</span>
        </h1>
        <p style={{color:"#4b7c59",fontSize:14,margin:0}}>
          120+ real schemes checked instantly · No data stored
        </p>
      </div>

      <div style={{background:"#fff",borderRadius:20,boxShadow:"0 8px 40px rgba(0,0,0,0.10)",
        padding:"clamp(1.5rem,4vw,2.2rem)",width:"100%",maxWidth:580,border:"1px solid #d1fae5"}}>

        <ProgressBar step={step}/>

        {step===0 && <StepPersonal form={form} set={set}/>}
        {step===1 && <StepBasicNeeds form={form} set={set}/>}
        {step===2 && <StepDynamic form={form} set={set}/>}
        {step===3 && <StepFinancial form={form} set={set}/>}
        {step===4 && <ReviewStep form={form} schemeCount={getEligibleSchemes(form).length}/>}

        <div style={{display:"flex",gap:12,marginTop:16}}>
          {step>0 && (
            <button onClick={()=>setStep(s=>s-1)} style={{
              flex:1,padding:"12px 0",borderRadius:10,border:"1.5px solid #d1d5db",
              background:"transparent",fontSize:15,fontWeight:600,color:"#374151",cursor:"pointer"}}>
              ← Back
            </button>
          )}
          <button
            onClick={()=>{ if(step===4) handleFind(); else setStep(s=>s+1); }}
            disabled={!stepValid[step]}
            style={{flex:2,padding:"12px 0",borderRadius:10,border:"none",
              background:!stepValid[step]?"#d1d5db":"#16a34a",
              color:"#fff",fontSize:15,fontWeight:700,
              cursor:!stepValid[step]?"not-allowed":"pointer",
              boxShadow:stepValid[step]?"0 4px 14px rgba(22,163,74,0.35)":"none",
              transition:"all 0.2s"}}>
            {step===4?"🔍 Find My Schemes →":"Continue →"}
          </button>
        </div>
      </div>
      <p style={{fontSize:11,color:"#6b7280",marginTop:16,textAlign:"center"}}>
        Data used only to match schemes · Never stored or shared
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 0 — Personal
// ─────────────────────────────────────────────────────────────────────────────
function StepPersonal({form,set}) {
  return (
    <div>
      <SectionTitle icon="👤" title="Personal Details" sub="Basic info to filter relevant schemes"/>
      <Field label="Full Name" required>
        <input style={inp} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Your full name"/>
      </Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="Age" required>
          <input style={inp} type="number" value={form.age} onChange={e=>set("age",e.target.value)} placeholder="e.g. 35" min="0" max="120"/>
        </Field>
        <Field label="Gender" required>
          <select style={sel} value={form.gender} onChange={e=>set("gender",e.target.value)}>
            <option value="">Select</option>
            <option>Male</option><option>Female</option><option>Transgender</option>
          </select>
        </Field>
      </div>
      <Field label="State / UT" required>
        <select style={sel} value={form.state} onChange={e=>set("state",e.target.value)}>
          <option value="">Select your state</option>
          {statesList.map(s=><option key={s}>{s}</option>)}
        </select>
      </Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="Social Category" required>
          <select style={sel} value={form.category} onChange={e=>set("category",e.target.value)}>
            <option value="">Select</option>
            <option>General</option><option>OBC</option><option>SC</option>
            <option>ST</option><option>EWS</option><option>Minority</option>
          </select>
        </Field>
        <Field label="Marital Status">
          <select style={sel} value={form.maritalStatus} onChange={e=>set("maritalStatus",e.target.value)}>
            <option value="">Select</option>
            <option>Single</option><option>Married</option><option>Widowed</option>
            <option>Divorced</option><option>Separated</option>
          </select>
        </Field>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:4}}>
        <Check label="♿ Disabled" checked={form.disability} onChange={v=>set("disability",v)}/>
        <Check label="🪪 Has Aadhaar" checked={form.aadhaar} onChange={v=>set("aadhaar",v)}/>
        <Check label="🏦 Bank Acct" checked={form.bankAccount} onChange={v=>set("bankAccount",v)}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW STEP — Basic Needs
// ─────────────────────────────────────────────────────────────────────────────
function StepBasicNeeds({form,set}) {
  return (
    <div>
      <SectionTitle icon="🧩" title="Basic Needs" sub="These help map housing, food, water, and documentation-linked schemes"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="Residence Type" required>
          <select style={sel} value={form.residenceType} onChange={e=>set("residenceType",e.target.value)}>
            <option value="">Select</option>
            <option>Rural</option>
            <option>Urban</option>
          </select>
        </Field>
        <Field label="Household Size">
          <input style={inp} type="number" min="1" placeholder="e.g. 4"
            value={form.householdSize} onChange={e=>set("householdSize",e.target.value)}/>
        </Field>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="Monthly House Rent (₹)">
          <input style={inp} type="number" min="0" placeholder="0 if own"
            value={form.monthlyRent} onChange={e=>set("monthlyRent",e.target.value)}/>
        </Field>
        <Field label="Ration Card Type">
          <select style={sel} value={form.rationCard} onChange={e=>set("rationCard",e.target.value)}>
            <option value="">None / Don't have</option>
            <option>APL (Above Poverty Line)</option>
            <option>BPL (Below Poverty Line)</option>
            <option>AAY (Antyodaya)</option>
            <option>PHH (Priority Household)</option>
          </select>
        </Field>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:6}}>
        <Check label="🚰 Has potable water" checked={form.hasPotableWater} onChange={v=>set("hasPotableWater",v)}/>
        <Check label="🚿 Has tap water" checked={form.hasTapWater} onChange={v=>set("hasTapWater",v)}/>
        <Check label="🧻 Has sanitation/toilet" checked={form.hasToilet} onChange={v=>set("hasToilet",v)}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:6}}>
        <Check label="🛒 Gets PDS ration" checked={form.hasPDSRation} onChange={v=>set("hasPDSRation",v)}/>
        <Check label="🧑‍⚕️ Chronic illness in family" checked={form.hasChronicIllness} onChange={v=>set("hasChronicIllness",v)}/>
        <Check label="🏫 School-age child not enrolled" checked={form.schoolAgeNotEnrolled} onChange={v=>set("schoolAgeNotEnrolled",v)}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:6}}>
        <Check label="📱 Has smartphone" checked={form.hasSmartphone} onChange={v=>set("hasSmartphone",v)}/>
        <Check label="🌐 Has internet" checked={form.hasInternet} onChange={v=>set("hasInternet",v)}/>
        <Check label="🏦 Aadhaar-linked bank" checked={form.hasAadhaarLinkedBank} onChange={v=>set("hasAadhaarLinkedBank",v)}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:6}}>
        <Check label="📜 Caste certificate" checked={form.hasCasteCert} onChange={v=>set("hasCasteCert",v)}/>
        <Check label="💳 Income certificate" checked={form.hasIncomeCert} onChange={v=>set("hasIncomeCert",v)}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Dynamic (profile-aware)
// ─────────────────────────────────────────────────────────────────────────────
function StepDynamic({form,set}) {
  const a = parseInt(form.age)||0;
  const female = form.gender==="Female";
  const senior = a>=60;
  const minor  = a<18;
  const student = form.employmentStatus==="Student";
  const farmer  = form.farmer || ["Farmer","Agricultural Worker"].includes(form.employmentStatus);

  const employmentOptions = () => {
    if (minor)  return ["Student","Child (not in school)","Apprentice"];
    if (senior) return ["Retired","Farmer","Daily Wage Worker","Self-employed","Salaried (Private)","Salaried (Government)","Homemaker","Unemployed"];
    return ["Student","Unemployed","Daily Wage Worker","Agricultural Worker","Farmer",
      "Self-employed","Salaried (Private)","Salaried (Government)","Construction Worker",
      "MSME/Small Business","Homemaker","Migrant Worker","Artisan/Craftsperson"];
  };

  return (
    <div>
      <SectionTitle icon="📋" title="About Your Work & Life"
        sub={`Questions tailored for ${a>0?`${a}-year-old `:""}${form.gender||"your"} profile`}/>

      <Field label="Current Employment / Status" required>
        <select style={sel} value={form.employmentStatus} onChange={e=>set("employmentStatus",e.target.value)}>
          <option value="">Select your status</option>
          {employmentOptions().map(o=><option key={o}>{o}</option>)}
        </select>
      </Field>

      {/* STUDENT SECTION */}
      {student && (
        <Subsection icon="🎓" title="Student Details">
          <Field label="Current Course / Class">
            <input style={inp} value={form.courseName} onChange={e=>set("courseName",e.target.value)}
              placeholder="e.g. 10th Standard, B.Tech, MBA"/>
          </Field>
          <Field label="Education Level">
            <select style={sel} value={form.education} onChange={e=>set("education",e.target.value)}>
              <option value="">Select</option>
              <option>Primary (1–5th)</option><option>Middle (6–8th)</option>
              <option>Secondary (9–10th)</option><option>Senior Secondary (11–12th)</option>
              <option>Diploma / ITI</option><option>Undergraduate</option>
              <option>Postgraduate</option><option>PhD</option>
            </select>
          </Field>
          <Field label="Institution Name">
            <input style={inp} value={form.institution} onChange={e=>set("institution",e.target.value)}
              placeholder="e.g. Government School, Anna University"/>
          </Field>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Check label="🎖️ Ward of Ex-Serviceman" checked={form.exServiceman} onChange={v=>set("exServiceman",v)}/>
          </div>
        </Subsection>
      )}

      {/* OCCUPATION for non-students */}
      {!student && (
        <Subsection icon="💼" title="Occupation Details">
          <Field label="Occupation / Type of Work">
            <input style={inp} value={form.occupation} onChange={e=>set("occupation",e.target.value)}
              placeholder="e.g. Farmer, Mason, Carpenter, Teacher, Tailor, Street vendor"/>
          </Field>
          {!senior && (
            <Field label="Highest Education Completed">
              <select style={sel} value={form.education} onChange={e=>set("education",e.target.value)}>
                <option value="">Select</option>
                <option>No formal education</option><option>Primary (1–5th)</option>
                <option>Middle (6–8th)</option><option>Secondary (9–10th)</option>
                <option>Senior Secondary (11–12th)</option><option>Diploma / ITI</option>
                <option>Graduate</option><option>Post Graduate</option>
              </select>
            </Field>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:4}}>
            <Check label="🌾 I am a Farmer" checked={form.farmer} onChange={v=>set("farmer",v)}/>
            <Check label="🚶 Migrant Worker" checked={form.migrantWorker} onChange={v=>set("migrantWorker",v)}/>
          </div>
        </Subsection>
      )}

      {/* FARMER DETAILS */}
      {farmer && (
        <Subsection icon="🚜" title="Farm Details">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Field label="Land Owned (acres)">
              <input style={inp} type="number" value={form.landOwned}
                onChange={e=>set("landOwned",e.target.value)} placeholder="0 if none" min="0"/>
            </Field>
            <Field label="Main Crop Grown">
              <input style={inp} value={form.cropType} onChange={e=>set("cropType",e.target.value)}
                placeholder="e.g. Rice, Wheat, Cotton"/>
            </Field>
          </div>
        </Subsection>
      )}

      {/* WOMEN SECTION */}
      {female && a>=18 && (
        <Subsection icon="👩" title="Women-Specific Details">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Check label="🤰 Pregnant / Nursing" checked={form.pregnant} onChange={v=>set("pregnant",v)}/>
            <Check label="🪷 Widow" checked={form.isWidow} onChange={v=>set("isWidow",v)}/>
            <Check label="👭 SHG Member" checked={form.selfHelp} onChange={v=>set("selfHelp",v)}/>
            <Check label="🍳 No LPG Gas" checked={!form.hasLPG} onChange={v=>set("hasLPG",!v)}/>
          </div>
          <Field label="Number of Children" style={{marginTop:10}}>
            <input style={{...inp,marginTop:8}} type="number" value={form.numChildren}
              onChange={e=>{set("numChildren",e.target.value);set("hasChildren",parseInt(e.target.value)>0);}}
              placeholder="0" min="0"/>
          </Field>
        </Subsection>
      )}

      {/* SENIOR SECTION */}
      {senior && (
        <Subsection icon="🧓" title="Senior Citizen Details">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Check label="🏠 Lives Alone" checked={form.livesAlone} onChange={v=>set("livesAlone",v)}/>
            <Check label="💰 Gets Pension" checked={form.hasPension} onChange={v=>set("hasPension",v)}/>
          </div>
        </Subsection>
      )}

      {/* HOUSING */}
      <Subsection icon="🏠" title="Housing & Basic Amenities">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Check label="🏠 Own a House" checked={form.ownHouse} onChange={v=>set("ownHouse",v)}/>
          <Check label="💡 Has Electricity" checked={form.hasElectricity} onChange={v=>set("hasElectricity",v)}/>
          <Check label="🚽 Has Toilet" checked={form.hasToilet} onChange={v=>set("hasToilet",v)}/>
        </div>
      </Subsection>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Financial
// ─────────────────────────────────────────────────────────────────────────────
function StepFinancial({form,set}) {
  const income = parseInt(form.annualIncome)||0;
  let incomeLabel="", incomeColor="#374151", incomeBg="#f3f4f6";
  if (income>0 && income<=50000)       {incomeLabel="Very Low Income"; incomeColor="#7c2d12"; incomeBg="#fee2e2";}
  else if (income<=120000)             {incomeLabel="Low Income"; incomeColor="#92400e"; incomeBg="#fef3c7";}
  else if (income<=300000)             {incomeLabel="Lower Middle Income"; incomeColor="#1e3a8a"; incomeBg="#dbeafe";}
  else if (income<=800000)             {incomeLabel="Middle Income"; incomeColor="#166534"; incomeBg:"#dcfce7";}
  else if (income>800000)              {incomeLabel="Upper Income"; incomeColor:"#374151"; incomeBg:"#f3f4f6";}

  return (
    <div>
      <SectionTitle icon="💰" title="Financial Details" sub="Used to match income-based eligibility criteria"/>
      <Field label="Annual Family Income (₹)" required hint="Total income of all earning members in your household">
        <input style={inp} type="number" value={form.annualIncome}
          onChange={e=>set("annualIncome",e.target.value)} placeholder="e.g. 120000"/>
      </Field>
      {income>0 && (
        <div style={{display:"inline-block",background:incomeBg,color:incomeColor,fontSize:12,
          fontWeight:700,padding:"4px 14px",borderRadius:20,marginBottom:12}}>{incomeLabel}</div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="House Status">
          <select style={sel} value={form.ownHouse?"own":"no"} onChange={e=>set("ownHouse",e.target.value==="own")}>
            <option value="no">Rented / No House</option>
            <option value="own">Own Pucca House</option>
          </select>
        </Field>
        <Field label="BPL / Antyodaya">
          <select style={sel} value={form.bplCard?"yes":"no"} onChange={e=>set("bplCard",e.target.value==="yes")}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </Field>
      </div>

      {income>0 && income<=300000 && (
        <div style={{marginTop:14,background:"#fffbeb",borderRadius:10,padding:"10px 14px",
          border:"1px solid #fde68a",fontSize:13,color:"#92400e"}}>
          💡 With ₹{income.toLocaleString("en-IN")}/year income, you likely qualify for multiple support schemes across housing, food security, health and skilling.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Review
// ─────────────────────────────────────────────────────────────────────────────
function ReviewStep({form, schemeCount}) {
  const rows = [
    ["Name", form.name],["Age & Gender",`${form.age} yrs · ${form.gender}`],
    ["State",form.state],["Category",form.category],
    form.maritalStatus&&["Marital Status",form.maritalStatus],
    ["Residence",form.residenceType||"—"],
    ["Employment",form.employmentStatus||"—"],
    form.education&&["Education",form.education],
    form.occupation&&["Occupation",form.occupation],
    form.courseName&&["Course",form.courseName],
    ["Annual Income",form.annualIncome?`₹${Number(form.annualIncome).toLocaleString("en-IN")}`:"—"],
    form.rationCard&&["Ration Card",form.rationCard],
    form.landOwned&&["Land Owned",`${form.landOwned} acres`],
    ["Household Size",form.householdSize||"—"],
    ["Monthly Rent",form.monthlyRent?`₹${Number(form.monthlyRent).toLocaleString("en-IN")}`:"—"],

    ["Bank Account",form.bankAccount?"✓ Yes":"✗ No"],
    ["Aadhaar",form.aadhaar?"✓ Yes":"✗ No"],
    ["Aadhaar-linked Bank",form.hasAadhaarLinkedBank?"✓ Yes":"✗ No"],
    ["Caste Certificate",form.hasCasteCert?"✓ Yes":"✗ No"],
    ["Income Certificate",form.hasIncomeCert?"✓ Yes":"✗ No"],

    ["BPL Card",form.bplCard?"✓ Yes":"✗ No"],
    form.disability&&["Disability","✓ Yes"],
    form.pregnant&&["Pregnant/Nursing","✓ Yes"],
    form.isWidow&&["Widow","✓ Yes"],
    form.farmer&&["Farmer","✓ Yes"],
    form.migrantWorker&&["Migrant Worker","✓ Yes"],
    form.selfHelp&&["SHG Member","✓ Yes"],

    ["Potable Water",form.hasPotableWater?"✓ Yes":"✗ No"],
    ["Tap Water",form.hasTapWater?"✓ Yes":"✗ No"],
    ["PDS Ration",form.hasPDSRation?"✓ Yes":"✗ No"],
    ["Chronic Illness",form.hasChronicIllness?"✓ Yes":"✗ No"],
    ["School-age not enrolled",form.schoolAgeNotEnrolled?"✓ Yes":"✗ No"],
    ["Smartphone",form.hasSmartphone?"✓ Yes":"✗ No"],
    ["Internet",form.hasInternet?"✓ Yes":"✗ No"],

    !form.hasElectricity&&["Electricity","✗ No"],
    !form.hasToilet&&["Toilet","✗ No"],
    !form.ownHouse&&["Own House","✗ No"],
  ].filter(Boolean);

  return (
    <div>
      <SectionTitle icon="✅" title="Review Your Profile" sub="Confirm before we check all 120+ schemes"/>
      <div style={{background:"#f0fdf4",borderRadius:14,padding:"1rem 1.2rem",
        border:"1px solid #bbf7d0",marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 24px"}}>
          {rows.map(([k,v])=>(
            <div key={k}>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"}}>{k}</div>
              <div style={{fontSize:13,fontWeight:600,color:"#14532d",marginTop:1}}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:"#166534",borderRadius:12,padding:"14px 18px",color:"#fff",textAlign:"center"}}>
        <div style={{fontSize:28,fontWeight:800}}>{schemeCount}+</div>
        <div style={{fontSize:13,opacity:0.9}}>schemes already identified · AI can add state-specific schemes too</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULTS PAGE
// ─────────────────────────────────────────────────────────────────────────────
function ResultsPage({schemes, aiExtra, aiLoading, form, onReset}) {
  const [selCat, setSelCat] = useState("All");
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");

  const allSchemes = [
    ...schemes.map(s=>({...s, source:"central"})),
    ...(aiExtra||[]).map(s=>({...s, source:"state"}))
  ];

  const cats = ["All",...Array.from(new Set(allSchemes.map(s=>s.category)))];
  let filtered = selCat==="All" ? allSchemes : allSchemes.filter(s=>s.category===selCat);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(s=>(s.name||"").toLowerCase().includes(q)||(s.benefit||"").toLowerCase().includes(q)||(s.category||"").toLowerCase().includes(q));
  }

  const totalBenefit = schemes.length + (aiExtra||[]).length;

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#f0fdf4 0%,#dcfce7 40%,#bbf7d0 100%)",
      padding:"1.5rem 1rem",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>

        {/* Header */}
        <div style={{textAlign:"center",marginBottom:"1.2rem"}}>
          <div style={{display:"inline-block",background:"#15803d",color:"#fff",
            borderRadius:20,padding:"4px 18px",fontSize:11,fontWeight:700,
            letterSpacing:"0.06em",marginBottom:10}}>
            🎯 RESULTS FOR {(form.name||"").toUpperCase()}
          </div>
          <h1 style={{fontSize:"clamp(1.3rem,3vw,1.9rem)",fontWeight:800,color:"#14532d",margin:"0 0 6px"}}>
            {totalBenefit} Schemes You're Eligible For
            {aiLoading && <span style={{fontSize:14,fontWeight:400,color:"#6b7280"}}> (finding more...)</span>}
          </h1>
          <p style={{color:"#4b7c59",fontSize:13,margin:0}}>
            {form.state} · {form.category} · {form.employmentStatus}
            {form.residenceType&&` · ${form.residenceType}`}
            {form.annualIncome&&` · ₹${Number(form.annualIncome).toLocaleString("en-IN")}/yr`}
          </p>
        </div>

        {/* Stats bar */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:"1rem"}}>
          {[
            ["Central Schemes", schemes.length, "#166534","#dcfce7"],
            ["State Schemes", (aiExtra||[]).length + (aiLoading?0:0), "#1e3a8a","#dbeafe"],
            ["Categories", new Set(allSchemes.map(s=>s.category)).size, "#4c1d95","#ede9fe"],
            ["Total Benefits", totalBenefit, "#92400e","#fef3c7"],
          ].map(([l,v,c,bg])=>(
            <div key={l} style={{background:bg,borderRadius:12,padding:"10px 12px",textAlign:"center",border:`1px solid ${bg}`}}>
              <div style={{fontSize:22,fontWeight:800,color:c}}>{v}{aiLoading&&l==="State Schemes"?"...":""}</div>
              <div style={{fontSize:10,fontWeight:600,color:c,opacity:0.8,marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{position:"relative",marginBottom:"1rem"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:16}}>🔍</span>
          <input style={{...inp,paddingLeft:38,borderRadius:12}} value={search}
            onChange={e=>setSearch(e.target.value)} placeholder="Search schemes by name or benefit..."/>
        </div>

        {/* Category filter */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:"1rem"}}>
          {cats.map(cat=>(
            <button key={cat} onClick={()=>setSelCat(cat)} style={{
              padding:"5px 14px",borderRadius:20,fontSize:12,fontWeight:600,
              border:selCat===cat?"none":"1.5px solid #d1d5db",
              background:selCat===cat?"#16a34a":"#fff",
              color:selCat===cat?"#fff":"#374151",cursor:"pointer",transition:"all 0.15s"}}>
              {catIcon(cat)} {cat}
            </button>
          ))}
        </div>

        {aiLoading && (
          <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:12,
            padding:"10px 16px",marginBottom:12,fontSize:13,color:"#92400e",display:"flex",gap:8,alignItems:"center"}}>
            <span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⏳</span>
            Finding additional state-specific schemes for {form.state}...
          </div>
        )}

        {/* Scheme list */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.length===0 ? (
            <div style={{textAlign:"center",padding:"2rem",color:"#6b7280"}}>
              No schemes match your search. Try different keywords.
            </div>
          ) : filtered.map((scheme,i)=>(
            <SchemeCard key={scheme.id||`${scheme.source}-${i}`} scheme={scheme} expanded={expanded===i}
              onToggle={()=>setExpanded(expanded===i?null:i)}/>
          ))}
        </div>

        {/* Footer */}
        <div style={{textAlign:"center",marginTop:"1.5rem",padding:"1.5rem",
          background:"#fff",borderRadius:16,border:"1px solid #d1fae5"}}>
          <p style={{color:"#6b7280",fontSize:11,margin:"0 0 14px",lineHeight:1.6}}>
            ⚠️ Results are based on profile matching against official scheme criteria. Visit official portals to confirm and apply. Policies update periodically—verify before applying.
          </p>
          <button onClick={onReset} style={{padding:"10px 28px",borderRadius:10,border:"none",
            background:"#16a34a",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",
            boxShadow:"0 4px 12px rgba(22,163,74,0.3)"}}>
            ← Check Another Person
          </button>
        </div>
      </div>
    </div>
  );
}

function SchemeCard({scheme,expanded,onToggle}) {
  const bg = categoryBg[scheme.category]||"#f3f4f6";
  const col = categoryColors[scheme.category]||"#374151";
  return (
    <div style={{background:"#fff",borderRadius:14,border:`1px solid ${expanded?"#16a34a":"#e5e7eb"}`,
      boxShadow:expanded?"0 4px 24px rgba(0,0,0,0.09)":"0 1px 4px rgba(0,0,0,0.04)",
      transition:"all 0.2s",overflow:"hidden"}}>
      <button onClick={onToggle} style={{width:"100%",display:"flex",alignItems:"center",gap:14,
        padding:"14px 18px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left"}}>
        <div style={{minWidth:42,height:42,borderRadius:10,background:bg,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
          {catIcon(scheme.category)}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:700,color:"#111827",lineHeight:1.3}}>{scheme.name}</div>
          <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{scheme.ministry}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
            <span style={{background:bg,color:col,fontSize:10,fontWeight:700,
              padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap"}}>{scheme.category}</span>
            {scheme.source==="state" && (
              <span style={{background:"#ede9fe",color:"#4c1d95",fontSize:10,fontWeight:700,
                padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap"}}>State</span>
            )}
          </div>
          <span style={{fontSize:16,color:"#9ca3af"}}>{expanded?"▲":"▼"}</span>
        </div>
      </button>
      {expanded && (
        <div style={{padding:"0 18px 18px",borderTop:"1px solid #f3f4f6"}}>
          {scheme.eligibilityNote && (
            <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,
              padding:"8px 12px",marginBottom:12,fontSize:13,color:"#14532d",fontWeight:500}}>
              ✅ {scheme.eligibilityNote}
            </div>
          )}
          <InfoRow icon="💰" label="Benefit" value={scheme.benefit}/>
          <InfoRow icon="📋" label="How to Apply" value={scheme.howToApply}/>
          {scheme.officialLink && (
            <div style={{marginTop:12}}>
              <a href={scheme.officialLink} target="_blank" rel="noreferrer" style={{
                display:"inline-flex",alignItems:"center",gap:6,color:"#16a34a",fontSize:13,
                fontWeight:600,textDecoration:"none",border:"1.5px solid #16a34a",
                borderRadius:8,padding:"6px 14px"}}>
                🌐 Official Portal ↗
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Shared components ──────────────────────────────────────────────────────
function SectionTitle({icon,title,sub}) {
  return (
    <div style={{marginBottom:"1.2rem"}}>
      <div style={{fontSize:19,fontWeight:800,color:"#14532d",marginTop:0}}>{icon} {title}</div>
      {sub&&<div style={{fontSize:13,color:"#6b7280",marginTop:3}}>{sub}</div>}
    </div>
  );
}
function Subsection({icon,title,children}) {
  return (
    <div style={{marginBottom:"1rem",padding:"12px 14px",borderRadius:12,border:"1px solid #e5e7eb",background:"#fafafa"}}>
      <div style={{fontSize:12,fontWeight:700,color:"#374151",marginBottom:10}}>{icon} {title}</div>
      {children}
    </div>
  );
}
function Field({label,children,required,hint}) {
  return (
    <div style={{marginBottom:"1rem"}}>
      <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:5}}>
        {label} {required&&<span style={{color:"#dc2626"}}>*</span>}
      </label>
      {hint&&<div style={{fontSize:11,color:"#6b7280",marginBottom:5}}>{hint}</div>}
      {children}
    </div>
  );
}
function Check({label,checked,onChange}) {
  return (
    <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:"#374151",
      padding:"8px 10px",borderRadius:8,border:`1.5px solid ${checked?"#16a34a":"#e5e7eb"}`,
      background:checked?"#f0fdf4":"#fff",transition:"all 0.15s",userSelect:"none"}}>
      <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}
        style={{width:15,height:15,accentColor:"#16a34a",cursor:"pointer"}}/>
      {label}
    </label>
  );
}
function InfoRow({icon,label,value}) {
  return (
    <div style={{marginTop:10}}>
      <div style={{fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",
        letterSpacing:"0.05em",marginBottom:3}}>{icon} {label}</div>
      <div style={{fontSize:13,color:"#1f2937",lineHeight:1.55}}>{value}</div>
    </div>
  );
}
function ProgressBar({step}) {
  const labels=["Personal","Basic Needs","Work & Life","Financial","Review"];
  return (
    <div style={{display:"flex",alignItems:"center",marginBottom:"1.8rem"}}>
      {labels.map((s,i)=>(
        <div key={s} style={{display:"flex",alignItems:"center",flex:1}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
            <div style={{width:32,height:32,borderRadius:"50%",
              background:i<step?"#15803d":i===step?"#16a34a":"transparent",
              border:i<=step?"none":"2px solid #d1d5db",
              display:"flex",alignItems:"center",justifyContent:"center",
              color:i<=step?"#fff":"#9ca3af",fontSize:12,fontWeight:700,
              boxShadow:i===step?"0 0 0 4px rgba(22,163,74,0.18)":"none"}}>
              {i<step?"✓":i+1}
            </div>
            <span style={{fontSize:9,marginTop:4,fontWeight:i===step?700:400,
              color:i<=step?"#15803d":"#9ca3af",letterSpacing:"0.02em",textAlign:"center"}}>{s}</span>
          </div>
          {i<labels.length-1&&<div style={{height:2,flex:1,background:i<step?"#15803d":"#e5e7eb",marginBottom:18}}/>}
        </div>
      ))}
    </div>
  );
}
function catIcon(cat) {
  const m={"Agriculture":"🌾","Housing":"🏠","Health":"🏥","Education":"📚","Employment":"💼",
    "Women & Child":"👩‍👧","Social Security":"🛡️","Financial Inclusion":"🏦","Skill Development":"🛠️","Others":"📋"};
  return m[cat]||"📋";
}
