import React from "react";

export default function QuickLinksIsland() {
  return (
    <div
      className="
      absolute
        bg-white 
        rounded-2xl 
        p-6 
        w-[200px]
        mx-4 mb-8 
        md:mb-0
      "
    >
      {/* Title / Name */}
      <h3 className="text-xl font-semibold text-dark-navy mb-4">Jason Peng</h3>

      {/* Location */}
      <div className="flex items-center text-sm text-gray-600 mb-4">
        <svg
          className="w-4 h-4 mr-2 text-gray-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 2a6 6 0 00-6 6c0 4.5 6 10 6 10s6-5.5 6-10a6 6 0 00-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z"
            clipRule="evenodd"
          />
        </svg>
        Berkeley, CA
      </div>

      {/* Quick Links */}
      <ul className="space-y-2 mb-6">
        <li>
          <a
            href="https://github.com/your‐username"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            GitHub
          </a>
        </li>
        <li>
          <a
            href="https://www.linkedin.com/in/iamjasonpeng7/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            LinkedIn
          </a>
        </li>
        <li>
          <a href="/blog" className="text-sm text-blue-600 hover:underline">
            Blog
          </a>
        </li>
      </ul>

      {/* Download Résumé Button */}
      <a
        href="/resume.pdf"
        download
        className="
          block 
          text-center 
          bg-dark-navy 
          text-white 
          text-sm 
          font-medium 
          py-2 
          rounded-md 
          hover:bg-opacity-90
        "
      >
        Download Résumé
      </a>
    </div>
  );
}
