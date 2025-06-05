import ExperienceCard from "@/components/ui/experience-block";

export default function ExperienceList() {
  const experiences = [
    {
      logoSrc: "/aggieworks_logo.png",
      companyName: "AggieWorks",
      title: "Software Engineer",
      startDate: "September 2024",
      description:
        "Worked on internal tools, mobile development, and web applications.",
    },
    {
      logoSrc:
        "https://codelabdavis.com/_astro/LogoSmallLight.Cp1apyqW_ECkes.svg",
      companyName: "CodeLab",
      title: "Product Developer",
      startDate: "September 2024",
      description:
        "Built software products for clients. Industry standard technologies like React, Node.js, and Docker.",
    },
    {
      logoSrc: "/jasewebdev.png",
      companyName: "Indepedent Web Dev",
      title: "Founding Engineer",
      startDate: "August 2023",
      description:
        "Designed web applications for small businesses. Core technologies used: AWS, MongoDB, and Next.js ",
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
