import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

export function FeaturedProjects() {
  const recentProjects = [
    {
      id: 1,
      title: "Peng Flooring",
      tagline: "B2B Platform for flooring and stair remodeling",
      thumbnail: "/pngfloorwebsite.png",
      tech: ["Bun", "TypeScript", "Cloudflare", "oAuth"],
      url: "https://www.pengfloor.com/",
    },
    {
      id: 2,
      title: "Internal Tool",
      tagline: "Club finance management tool",
      thumbnail: "/aggiemenuslaptop.png",
      tech: ["Hono", "Bun", "Drizzle", "Docker", "Next.js"],
    },
    {
      id: 3,
      title: "Atharva's Portfolio",
      tagline: "UC Davis dining menu app",
      thumbnail: "/akwebsite.png",
      tech: ["Next.js", "TypeScript", "Vercel"],
      url: "https://atharvapk.com/",
    },
  ];

  return (
    <main className="w-full max-w-6xl mx-auto">
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, staggerChildren: 0.1 }}
      >
        {recentProjects.map((project) => (
          <motion.div
            key={project.id}
            className="group bg-dark-navy dark:bg-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 border-2 border-dark-navy"
            whileHover={{ scale: 1.02 }}
          >
            {/* Project Image */}
            <div className="relative h-48 overflow-hidden">
              <Image
                src={project.thumbnail}
                alt={`${project.title} - ${project.tagline} - Project preview`}
                width={400}
                height={200}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Project Content */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-white mb-1">
                {project.title}
              </h3>
              <div className="min-h-[60px]">
                <p className="text-[#dbd7d7] text-sm mb-3 ">
                  {project.tagline}
                </p>
              </div>

              {/* Tech Stack */}
              <div className="flex flex-wrap gap-1 mb-4">
                {project.tech.map((tech, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <a
                  href={project?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-white hover:bg-blue-900/30 text-sm font-medium py-2 px-3 rounded-lg transition-colors text-center border border-white"
                >
                  View
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </main>
  );
}
