import React, { useRef, useState } from "react";

export default function ProjectShowcase() {
  const scrollRef = useRef(null);
  const [selectedProject, setSelectedProject] = useState(null);

  const projects = [
    {
      id: 1,
      title: "RoomU",
      thumbnail: "/roomulaptop.png",
      tags: [
        "Typescript",
        "React Native",
        "Docker",
        "Bun",
        "Tailwind",
        "MySQL",
        "Fullstack Development",
      ],
      landingPage: "https://roomu.aggieworks.org/",
      description:
        "RoomU is a mobile app designed to help students find roommates and housing options before lease signing season. It features a user-friendly interface with real-time chat, profile matching, seamless onbaording flow, and a responsive design optimized for mobile devices.",
      url: "https://roomu.aggieworks.org/",
    },
    {
      id: 2,
      title: "Wishr",
      thumbnail: "/wishrlaptop.png",
      tags: [
        "Typescript",
        "Next.js",
        "Supabase",
        "Clerk Auth",
        "MySQL",
        "Node.js",
        "Database Management",
      ],
      landingPage: "/wishr.png",
      description:
        "Wishr is a full-stack web application that allows users to create, share, and manage wishlists. It features user authentication and heavy database interactions, providing an efficient platform for wishlist management.",
      url: "https://www.wishr.tech/",
    },
    {
      id: 3,
      title: "AggieMenus",
      thumbnail: "/aggiemenuslaptop.png",
      tags: [
        "Typescript",
        "Next.js",
        "Web Scrape",
        "Docker",
        "API Design",
        "Cloudflare Tunnels",
      ],
      landingPage: "/aggiemenulanding.png",
      description:
        "AggieMenus is a progressive web app that provides up to date dining hall menus for UC Davis students. It features both food trucks and dining halls on campus, dietary filters, and a favorites page. ",
      url: "https://www.aggiemenus.org/menu/",
    },
    {
      id: 4,
      title: "Pinpoint",
      thumbnail: "/pinpointlaptop.png",
      tags: ["Tyepscript", "Next.js", "React", "Google Auth", "Supabase"],
      landingPage: "https://pinpoint-revamped.vercel.app/",
      description:
        "Pinpoint is a web application that centralizes lost and found items for UC Davis students. It features a user-friendly interface with a clear onboard flow, user-friendly dashboard, item search functionality, and a item-matching system.",
      url: "https://pinpoint-revamped.vercel.app/",
    },
    {
      id: 5,
      title: "Flooring Reno",
      thumbnail: "/pengfloorlaptop.png",
      tags: ["React + Vite", "Express", "API Design"],
      landingPage: "/flooring-landing.png",
      description:
        "This is a mock e-commerce web app I built to practice my skills in backend development and API design. It features multiple RESTful methods connected to a dynamic shopping cart. Used Express for routing, middleware, and database interactions.",
      url: "https://pinpoint-revamped.vercel.app/",
    },
  ];

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: -scrollRef.current.offsetWidth * 0.8,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: scrollRef.current.offsetWidth * 0.8,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative w-full ">
      {/* Carousel container */}
      <div className="relative">
        {/* Left button */}
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 bg-white bg-opacity-70 p-2 rounded-full shadow-md hover:bg-opacity-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Right button */}
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 bg-white bg-opacity-70 p-2 rounded-full shadow-md hover:bg-opacity-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        <div
          ref={scrollRef}
          className="flex space-x-6 overflow-x-scroll hide-scrollbar px-4 snap-x snap-mandatory"
        >
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="snap-start flex-shrink-0 w-64 cursor-pointer"
              onClick={() => setSelectedProject(proj)}
            >
              <div className="border bg-extreme-light-blue2 border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                <img src={proj.thumbnail} alt={proj.title} className="" />
                <div className="p-3 bg-white min-h-[140px]">
                  <div className="font-semibold text-lg text-dark_navy mb-2">
                    {proj.title}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {proj.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                      >
                        #{tag.replace(/\s+/g, "")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal overlay */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl relative">
            {/* Close button */}
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Desktop frame mockup & content */}
            <div className="pt-6 px-6 pb-8">
              {/* Desktop frame */}
              <div className="w-full bg-gray-200 border border-gray-300 rounded-t-md overflow-hidden">
                {/* Window controls */}
                <div className="flex items-center space-x-2 bg-gray-300 px-3 py-1">
                  <span className="w-3 h-3 bg-red-400 rounded-full" />
                  <span className="w-3 h-3 bg-yellow-400 rounded-full" />
                  <span className="w-3 h-3 bg-green-400 rounded-full" />
                </div>
                {/* "Screen" area: iframe if URL, img if image */}
                {/\.(png|jpe?g|gif|bmp|webp)$/i.test(
                  selectedProject.landingPage
                ) ? (
                  <img
                    src={selectedProject.landingPage}
                    alt={`${selectedProject.title} snapshot`}
                    className="w-full object-contain"
                  />
                ) : (
                  <iframe
                    src={selectedProject.landingPage}
                    title={selectedProject.title}
                    className="w-full h-64 md:h-80 lg:h-96"
                    sandbox="allow-scripts allow-same-origin"
                  />
                )}
              </div>

              {/* Description */}
              <div className="mt-6 text-gray-800 text-justify">
                <p className="text-lg text-gray-800 break-words">
                  <span className="text-5xl font-bold float-left mr-2">
                    {selectedProject.description.charAt(0)}
                  </span>
                  {selectedProject.description.slice(1)}
                </p>
              </div>

              {/* Tags list */}
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedProject.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
                  >
                    #{tag.replace(/\s+/g, "")}
                  </span>
                ))}
              </div>

              {/* Visit website footer */}
              <div className="mt-8 border-t border-gray-200 pt-4 text-center">
                <a
                  href={selectedProject.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Visit Website
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hide scrollbar for all browsers */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
