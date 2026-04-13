"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ProjectExpandModal } from "../ui/project-modal";

export function FeaturedProjects() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [originRect, setOriginRect] = useState(null);

  const featuredProjects = [
    {
      id: 1,
      title: "RoomU",
      tagline: "Mobile app for finding roommates and housing options",
      thumbnail: "/roomu-intro.png",
      tech: ["React Native", "iOS", "Docker", "Hono"],
      url: "https://roomu.aggieworks.org/",
      modalImage: "/roomu-pufo-modal.png",
      gallery: [
        "/roomu-gallery-onboarding.png",
        "/roomu-gallery-chat.png",
        "/roomu-gallery-myprofile.png",
        "/roomu-gallery-listings.png",
      ],
    },
    {
      id: 2,
      title: "Wishr",
      tagline: "Web application for wishlist management and sharing",
      thumbnail: "/wishr-hero.png",
      tech: ["React", "SQL", "Zod", "API"],
      url: "https://mywisher.me",
      modalImage: "/wishr-hero1.png",
      gallery: ["/wishr-home.png", "/wishr-join.png", "/wishr-wishlist.png"],
    },
  ];

  return (
    <main className="w-full max-w-6xl mx-auto">
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, staggerChildren: 0.1 }}
      >
        {featuredProjects.map((project) => (
          <div
            key={project.id}
            className="group relative w-full rounded-md overflow-hidden"
          >
            {/* Image sizes the card; overlays sit on top */}
            <Image
              src={project.thumbnail}
              alt={`${project.title} - ${project.tagline} - Project preview`}
              width={400}
              height={400}
              className="relative z-0 block w-full h-full object-cover"
            />

            <div
              className="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-black/50 via-black/10 to-transparent"
              aria-hidden
            />

            <div className="absolute inset-0 z-20 flex flex-col justify-end p-4 pointer-events-none">
              <button
                type="button"
                className="pointer-events-auto w-full bg-white rounded-sm p-4 flex items-center justify-between transition-transform active:scale-[0.98] hover:bg-gray-50 text-left shadow-sm"
                onClick={(e) => {
                  const { top, left, width, height } =
                    e.currentTarget.getBoundingClientRect();
                  setOriginRect({ top, left, width, height });
                  setSelectedProject(project);
                }}
              >
                <div className="flex flex-col items-start text-left">
                  <h3 className="red-hat-normal leading-tight text-gray-900 font-bold text-lg">
                    {project.title}
                  </h3>
                  <p className="red-hat-normal leading-tight text-gray-500 text-sm line-clamp-1">
                    {project.tagline}
                  </p>
                </div>

                <Image
                  src="/up-right-arrow.svg"
                  alt="Up arrow right"
                  width={100}
                  height={100}
                  className="w-8 h-8"
                />
              </button>
            </div>
          </div>
        ))}
      </motion.div>

      {selectedProject && (
        <ProjectExpandModal
          project={selectedProject}
          originRect={originRect}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </main>
  );
}
