import ExperienceCard from "@/components/ui/experience-block";

export default function ExperienceList() {
  const experiences = [
    {
      logoSrc: "/ibm-logo.png",
      companyName: "IBM",
      title: "Software Developer",
      startDate: "June 2026",
      description: "",
    },
    {
      logoSrc: "/asucd-irl-logo.png",
      companyName: "ASUCD IRL",
      title: "Software Engineer",
      startDate: "December 2025",
      description:
        "Modernized legacy Unitrans backend system within official UC Davis mobile app.",
    },
    {
      logoSrc: "/aggieworks_logo.png",
      companyName: "AggieWorks",
      title: "Software Engineer",
      startDate: "September 2024",
      description:
        "Worked on internal tools, mobile app development, and web applications for UC Davis students.",
    },
    {
      logoSrc:
        "https://codelabdavis.com/_astro/LogoSmallLight.Cp1apyqW_ECkes.svg",
      companyName: "CodeLab",
      title: "Product Developer",
      startDate: "September 2024",
      description:
        "Built software products for clients. Industry standard technologies like React, Node.js, Docker, and Supabase.",
    },
    {
      logoSrc: "/jasewebdev.png",
      companyName: "Web Developer",
      title: "Founder",
      startDate: "August 2023",
      description:
        "Designed web applications for small businesses. Core technologies used: Typescript, Bun/Hono, Drizzle, PostgresSQL, Docker, and Cloudflare ",
    },
  ];

  return (
    <div className="max-w-[800px] mx-auto space-y-[15px]">
      {experiences.map((exp, idx) => (
        <ExperienceCard
          key={idx}
          logoSrc={exp.logoSrc}
          companyName={exp.companyName}
          title={exp.title}
          startDate={exp.startDate}
          description={exp.description}
        />
      ))}
    </div>
  );
}
