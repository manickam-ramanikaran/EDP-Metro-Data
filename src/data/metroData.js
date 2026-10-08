export const sources = [
  { id:"policy", name:"Policy & Admin", icon:"▦", color:"#b985ff", detail:"Policy administration and operational source data." },
  { id:"crm", name:"CRM", icon:"◎", color:"#48b8ff", detail:"Customer, adviser and interaction data." },
  { id:"finance", name:"Finance", icon:"₹", color:"#8edb48", detail:"Payments, ledger, treasury and finance data." },
  { id:"mdm", name:"MDM / BI", icon:"◇", color:"#ffc342", detail:"Master, reference, warehouse and reporting data." },
  { id:"external", name:"External Data", icon:"⇄", color:"#ff6b63", detail:"Partner, regulatory and third-party datasets." },
  { id:"stream", name:"Files / APIs / Events", icon:"⌁", color:"#35d8d1", detail:"Batch files, APIs and event-stream inputs." }
];

export const layers = [
  { id:"raw", short:"RAW", name:"RAW Layer", icon:"⇩", color:"#b46cff", purpose:"Land source data in its original form with traceability and auditability.", activities:["Source-aligned landing","Immutable history","Technical metadata capture","Initial security controls"], outputs:["Auditable source copy","Input for standardisation"] },
  { id:"standardised", short:"STD", name:"Standardised Layer", icon:"☷", color:"#38aefe", purpose:"Apply consistent technical formats, structures, naming and foundational quality checks.", activities:["Schema standardisation","Naming conventions","Data-type alignment","Basic validation and cleansing","Reference format alignment"], outputs:["Consistent datasets","Ready for cross-source integration"] },
  { id:"integration", short:"INT", name:"Integration Layer", icon:"⌘", color:"#ff9d22", purpose:"Combine, enrich and match data across source domains before enterprise conformance.", activities:["Cross-source joins","Entity matching","Reference-data enrichment","Business-rule application","Dependency orchestration"], outputs:["Integrated domain views","Matched and enriched records"] },
  { id:"conformed", short:"CNF", name:"Conformed Layer", icon:"✓", color:"#23d8cb", purpose:"Align integrated data to common enterprise definitions and trusted business entities.", activities:["Common business definitions","Conformed dimensions","Reconciliation","Deduplication","Trust controls"], outputs:["Trusted enterprise datasets","Reusable conformed entities"] },
  { id:"curated", short:"CUR", name:"Curated Layer", icon:"▤", color:"#9ce83e", purpose:"Create consumption-ready data products designed for defined business outcomes.", activities:["Business-focused modelling","Aggregations and measures","Purpose-specific data products","Performance optimisation","Consumption contracts"], outputs:["Business-ready data products","Analytics and operational datasets"] }
];

export const deliveries = [
  {id:"analytics",name:"Analytics & Reporting",icon:"▥"},
  {id:"apps",name:"Operational Applications",icon:"▣"},
  {id:"ai",name:"Data Science & AI",icon:"✣"},
  {id:"regulatory",name:"Regulatory Reporting",icon:"▧"},
  {id:"customer",name:"Customer Platforms",icon:"◉"},
  {id:"api",name:"APIs & Data Sharing",icon:"☁"}
];

export const qa = {
  "raw":"The RAW Layer preserves source-aligned data and maintains traceability before downstream transformation.",
  "standardised":"The Standardised Layer aligns formats, schemas, names and foundational quality rules.",
  "integration":"The Integration Layer is the central interchange. It matches, joins and enriches information from multiple source domains before enterprise conformance.",
  "conformed":"The Conformed Layer applies common enterprise definitions, reconciles entities and produces reusable trusted datasets.",
  "curated":"The Curated Layer packages trusted information into consumption-ready data products for defined business needs.",
  "difference":"Standardised focuses on technical consistency. Conformed focuses on consistent enterprise business meaning.",
  "delivery":"Curated data products are delivered to analytics, operational applications, AI, regulatory reporting, customer platforms and APIs."
};
