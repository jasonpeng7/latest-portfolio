// src/components/ui/PrsnlModal.jsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import PhotoblogPage from "../features/photoblogCMPNT";
export default function PersonalInfoModal({ visible, onClose }) {
  // Wrapper: either show full‐screen overlay, or hide completely
  const wrapperClass = visible
    ? "fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
    : "fixed inset-0 z-[-1] opacity-0 pointer-events-none";

  // Inner modal: either full size, or shrunk to zero when invisible
  const modalClass = visible
    ? `
        bg-white 
        relative
        hide-scrollbar 
        overflow-y-auto 
        flex flex-col 
        justify-start items-center 
        rounded-2xl shadow-2xl 
        w-full max-w-[1000px] 
        max-h-[90vh]
      `
    : "w-0 h-0 overflow-hidden";

  return (
    <div className={wrapperClass}>
      <motion.div
        initial={false}
        animate={
          visible ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0 }
        }
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={modalClass}
      >
        {/* Header & Close Button */}
        <div className="w-full">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
          <div className="flex justify-end p-4">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 text-2xl"
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-8 overflow-y-auto flex-1 w-full">
          <div className="max-w-[800px] mx-auto py-4 space-y-6">
            {/* Personal Life */}
            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-dark-navy mb-2 relative inline-block">
                Personal Life
                <span className="absolute left-0 -bottom-1 block w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></span>
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Apart from coding, I love to travel and immerse myself in new
                experiences and food! I really enjoy being active—whether it’s
                playing basketball, pickleball, hiking, working out; you name
                it! A little fun fact about me is that I spent over $500 on a
                single mobile game (insert cry emoji here).
              </p>
            </section>

            {/* Divider */}
            <div className="border-t border-gray-200 my-4" />

            {/* Career Interests */}
            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-dark-navy mb-2 relative inline-block">
                Career Interests
                <span className="absolute left-0 -bottom-1 block w-12 h-1 bg-gradient-to-r from-pink-500 to-yellow-500 rounded"></span>
              </h3>
              <ul className="list-inside space-y-2">
                <li className="flex items-start">
                  <span className="mt-1 mr-2 text-blue-500">•</span>
                  <span className="text-sm text-gray-700">
                    AI &mdash; Developing and deploying machine learning models
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mt-1 mr-2 text-purple-500">•</span>
                  <span className="text-sm text-gray-700">
                    Backend-heavy projects &mdash; Exploring new frameworks and
                    architectures
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mt-1 mr-2 text-green-500">•</span>
                  <span className="text-sm text-gray-700">
                    Cybersecurity &mdash; Implementing secure, end-to-end
                    solutions
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mt-1 mr-2 text-pink-500">•</span>
                  <span className="text-sm text-gray-700">
                    Cloud-native &mdash; Building with Docker, Kubernetes,
                    serverless
                  </span>
                </li>
              </ul>
            </section>

            {/* Divider */}
            <div className="border-t border-gray-200 my-4" />

            {/* Glimpse of My Life (PhotoBlogPage) */}
            <section className="space-y-4">
              <h4 className="text-2xl font-semibold text-dark-navy mb-2 relative inline-block">
                Glimpse of My Life
                <span className="absolute left-0 -bottom-1 block w-12 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded"></span>
              </h4>
              <div className="flex mb-6 justify-center items-center">
                {/* PhotoBlogPage uses Next’s <Image priority> so everything preloads */}
                <PhotoblogPage />
              </div>
            </section>
          </div>
        </div>

        {/* Footer Download Button */}
        <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0 w-full">
          <a
            href="/resume.pdf"
            download
            className="
              block 
              w-full 
              text-center 
              bg-dark-navy 
              text-white 
              text-sm 
              font-semibold 
              py-2 
              rounded-md 
              hover:bg-opacity-90 
              transition 
              focus:outline-none 
              focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            "
          >
            Download Résumé
          </a>
        </div>
      </motion.div>
    </div>
  );
}
