export const profile = {
  name: "Jason Peng",
  title: "Software Engineer",
  email: "jiapeng@ucdavis.edu",
  github: "https://github.com/jasonpeng7",
  linkedin: "https://www.linkedin.com/in/iamjasonpeng7/",
  website: "https://jasonpe.com",
  bio: "Fullstack developer and computer science student in love with building impactful software. My work focuses on web development, from design to coding, mobile development, and backend systems.",
  portrait: "/images/jason-santorini.jpg",
};

export const skills = [
  "Python",
  "C/C++",
  "Typescript",
  "SQL",
  "Kubernetes",
  "Jenkins",
  "React Native",
  "Hono",
  "Docker",
  "Git",
  "RAG",
];

export const experiences = [
  {
    company: "IBM",
    title: "Software Developer",
    date: "June 2026",
    logo: "/ibm-logo.png",
    description:
      "Built Kubernetes-based Spark debugging tools and Jenkins pipelines to validate watsonx.data installations and stress-test engine concurrency on OpenShift.",
  },
  {
    company: "ASUCD IRL",
    title: "Software Engineer",
    date: "December 2025",
    logo: "/asucd-irl-logo.png",
    description:
      "Modernized the legacy Unitrans backend system within the official UC Davis mobile app.",
  },
  {
    company: "AggieWorks",
    title: "Software Engineer",
    date: "September 2024",
    logo: "/aggieworks_logo.png",
    description:
      "Worked on internal tools, mobile app development, and web applications for UC Davis students.",
  },
  {
    company: "CodeLab",
    title: "Product Developer",
    date: "September 2024",
    description:
      "Built software products for clients using React, Node.js, Docker, and Supabase.",
  },
  {
    company: "Web Developer",
    title: "Founder",
    date: "August 2023",
    logo: "/jasewebdev.png",
    description:
      "Designed web applications for small businesses with TypeScript, Bun/Hono, Drizzle, PostgreSQL, Docker, and Cloudflare.",
  },
];

export const projects = [
  {
    id: "spark-copilot",
    name: "Spark Copilot",
    context: "IBM · WatsonX Challenge · August 2026",
    description:
      "An IDE extension that diagnoses failed jobs on IBM watsonx.data Spark engines using a local IBM Granite model and relevant Kubernetes pod events and logs.",
    contribution:
      "Built the debugging extension and a retrieval-augmented generation (RAG) system grounded in previous customer issues and official Spark and watsonx.data documentation to classify root causes with real operational context.",
    outcome:
      "Reduced a manual log hunt of roughly 15 minutes to a 10-second AI diagnosis — approximately 90× faster debugging for engineering and support teams.",
    image: "/images/projects/spark-copilot-hero.webp",
    imageAlt: "Concept illustration of Spark Copilot turning Kubernetes logs into an AI diagnosis",
    tech: ["Python", "IBM Granite", "Ollama", "RAG", "Kubernetes", "OpenShift", "watsonx.data"],
    gallery: [],
  },
  {
    id: "roomu",
    name: "RoomU",
    description: "A mobile app for finding roommates and housing options.",
    image: "/roomu-intro.png",
    tech: ["React Native", "iOS", "Docker", "Hono"],
    url: "https://roomu.aggieworks.org/",
    gallery: [
      "/roomu-gallery-onboarding.png",
      "/roomu-gallery-chat.png",
      "/roomu-gallery-myprofile.png",
      "/roomu-gallery-listings.png",
    ],
  },
  {
    id: "wishr",
    name: "Wishr",
    description: "A web application for wishlist management and sharing.",
    image: "/wishr-hero.png",
    tech: ["React", "SQL", "Zod", "API"],
    url: "https://mywisher.me",
    gallery: ["/wishr-home.png", "/wishr-join.png", "/wishr-wishlist.png"],
  },
  {
    id: "aggiemenus",
    name: "AggieMenus",
    description:
      "A progressive web app with up-to-date UC Davis dining hall and food truck menus, dietary filters, and favorites.",
    contribution:
      "Refactored the frontend, then worked on scraping official dining menus using Selenium and BeautifulSoup.",
    image: "/aggiemenuslaptop.png",
    tech: [
      "TypeScript",
      "Next.js",
      "Web Scraping",
      "Docker",
      "Cloudflare Tunnels",
    ],
    url: "https://www.aggiemenus.org/menu/",
    gallery: ["/aggiemenulanding.png"],
  },
];
