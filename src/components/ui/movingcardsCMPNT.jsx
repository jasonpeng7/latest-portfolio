"use client";

import React from "react";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

export function InfiniteMovingCardsDemo() {
  return (
    <div className="z-0 rounded-md flex flex-col antialiased dark:bg-grid-white/[0.05] items-center justify-center relative overflow-hidden">
      <InfiniteMovingCards
        items={testimonials}
        direction="right"
        speed="normal"
        className=""
      />
    </div>
  );
}

const testimonials = [
  {
    svgPath: "/mongoDB.svg",
  },
  {
    svgPath: "/tailwind.svg",
  },
  {
    svgPath: "/tslogo.svg",
  },
  {
    svgPath: "/jslogo.svg",
  },
  {
    svgPath: "/github-mark.png",
  },
  {
    svgPath: "/nextjs.svg",
  },
  {
    svgPath: "/pythonlogo.svg",
  },
  {
    svgPath: "/css.svg",
  },
  {
    svgPath: "/c.svg",
  },
  {
    svgPath: "/docker-mark-blue.svg",
  },
];
