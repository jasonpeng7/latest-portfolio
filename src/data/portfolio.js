export const profile = {
  name: "Jason Peng",
  title: "Software Engineer",
  email: "jiapeng@ucdavis.edu",
  github: "https://github.com/jasonpeng7",
  linkedin: "https://www.linkedin.com/in/iamjasonpeng7/",
  website: "https://jasonpe.com",
  bio: "Fullstack developer and computer science student in love with building impactful software. My work focuses on web development, from design to coding, mobile development, and backend systems.",
  portrait: "/jason.jpg",
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
  {
    id: "pinpoint",
    name: "Pinpoint",
    description:
      "A lost-and-found web application for UC Davis students with onboarding, a dashboard, item search, and item matching.",
    contribution:
      "Created the onboarding flow, search functionality, and an item-matching system using exact-match filtering.",
    image: "/pinpointlaptop.png",
    tech: ["TypeScript", "Next.js", "React", "Google Auth", "Supabase"],
    url: "https://pinpoint-revamped.vercel.app/",
    gallery: [],
  },
  {
    id: "aplus",
    name: "A+ Home Improvement",
    description:
      "A website for a local home improvement company that generates leads for the business.",
    image: "/pengfloorlaptop.png",
    tech: ["Web Development", "Lead Generation"],
    url: "https://aplus4home.com/",
    gallery: ["/flooring-landing.png"],
  },
];
