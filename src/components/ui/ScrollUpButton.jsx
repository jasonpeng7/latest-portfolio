import React, { useState, useEffect } from "react";

const ScrollUpIndicator = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // total height of the page (including content outside of viewport)
      const scrollHeight = document.documentElement.scrollHeight;
      // height of the viewport itself
      const clientHeight = window.innerHeight;

      // compute halfway point
      const halfwayPoint = (scrollHeight - clientHeight) / 2;

      // DEBUG: print values in console
      console.log({
        scrollY: Math.round(scrollY),
        clientHeight,
        scrollHeight,
        halfwayPoint: Math.round(halfwayPoint),
        visible: scrollY >= halfwayPoint,
      });

      setIsVisible(scrollY >= halfwayPoint);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    // do NOT call handleScroll() here—let the first scroll event trigger it
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4">
      <div className="flex flex-col items-center animate-bounce">
        {/* Up arrow */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 mb-1 text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>

        {/* Vertically oriented “SCROLL UP” */}
        <span
          style={{ writingMode: "vertical-rl" }}
          className="text-sm font-medium text-gray-700"
        >
          SCROLL UP
        </span>
      </div>
    </div>
  );
};

export default ScrollUpIndicator;
