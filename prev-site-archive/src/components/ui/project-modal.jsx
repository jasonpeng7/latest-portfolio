"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

const DURATION = "0.44s";
const EASING = "cubic-bezier(0.32, 0.72, 0, 1)";

function ModalContent({ project, onClose }) {
  return (
    <>
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white flex items-center justify-center transition-colors"
      >
        <p>X</p>
      </button>

      <div className="relative w-full aspect-16/10 bg-gray-50 shrink-0 overflow-hidden">
        <Image
          src={project.modalImage}
          alt={`${project.title} preview`}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-5 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 leading-tight">
          {project.title}
        </h2>
        <p className="text-gray-500 text-sm sm:text-base mb-4 leading-relaxed">
          {project.tagline}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {project.tech.map((t, i) => (
            <span
              key={i}
              className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs sm:text-sm rounded-md font-medium"
            >
              {t}
            </span>
          ))}
        </div>

        {Array.isArray(project.gallery) && project.gallery.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-5">
            {project.gallery.map((url, index) => (
              <div
                key={`${project.id}-gallery-${index}`}
                className="relative w-full h-full overflow-hidden rounded-md"
              >
                <Image
                  src={url}
                  alt={`${project.title} gallery image ${index + 1}`}
                  className="w-full h-full"
                  width={1000}
                  height={1000}
                />
              </div>
            ))}
          </div>
        )}

        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-extreme-light-blue px-5 py-2.5 text-center text-sm raleway_regular text-black"
          >
            Visit Project
          </a>
        )}
      </div>
    </>
  );
}

export function ProjectExpandModal({ project, originRect, onClose }) {
  const [phase, setPhase] = useState("idle");
  const originRef = useRef(originRect);
  const panelRef = useRef(null);

  useEffect(() => {
    if (originRect) originRef.current = originRect;
    setPhase("origin");
  }, [originRect]);

  useEffect(() => {
    if (phase !== "origin") return;
    document.body.style.overflow = "hidden";
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setPhase("expanded"));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [phase]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleTransitionEnd = useCallback(
    (e) => {
      if (e.target !== panelRef.current || e.propertyName !== "width") return;
      if (phase === "expanded") setPhase("open");
      if (phase === "collapsing") {
        document.body.style.overflow = "";
        onClose();
      }
    },
    [phase, onClose],
  );

  const handleClose = useCallback(() => setPhase("collapsing"), []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  if (phase === "idle") return null;

  const rect = originRef.current;
  if (!rect) return null;

  const atOrigin = phase === "origin" || phase === "collapsing";
  const showBackdrop = !atOrigin;
  const showContent = phase === "open";

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const mw = Math.min(vw - 32, 580);
  const mh = Math.min(vh - 48, 640);

  const panelStyle = atOrigin
    ? {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        borderRadius: 2,
      }
    : {
        top: (vh - mh) / 2,
        left: (vw - mw) / 2,
        width: mw,
        height: mh,
        borderRadius: 16,
      };

  const transitionValue = [
    `top ${DURATION} ${EASING}`,
    `left ${DURATION} ${EASING}`,
    `width ${DURATION} ${EASING}`,
    `height ${DURATION} ${EASING}`,
    `border-radius ${DURATION} ${EASING}`,
  ].join(", ");

  return createPortal(
    <div className="fixed inset-0 z-9999" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        style={{
          opacity: showBackdrop ? 1 : 0,
          transition: `opacity ${DURATION} ${EASING}`,
        }}
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className="fixed bg-white shadow-2xl overflow-hidden"
        style={{ ...panelStyle, transition: transitionValue }}
        onTransitionEnd={handleTransitionEnd}
      >
        <div
          className="relative w-full h-full overflow-y-auto"
          style={{
            opacity: showContent ? 1 : 0,
            transition: "opacity 0.2s ease",
            transitionDelay: showContent ? "0.12s" : "0s",
          }}
        >
          <ModalContent project={project} onClose={handleClose} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
