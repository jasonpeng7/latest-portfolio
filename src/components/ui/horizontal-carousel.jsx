"use client";

import React, { useEffect, useRef } from "react";
import styles from "@/app/HorizontalCaorousel.module.css";

export default function HorizontalCarousel({ items, speed = 10 }) {
  const scrollRef = useRef(null);
  const hoverMultiplier = 0.5;

  useEffect(() => {
    if (!scrollRef.current) return;
    const animations = scrollRef.current.getAnimations();
    if (!animations || animations.length === 0) return;

    const scrollAnimation = animations[0];
    const handleMouseEnter = () => {
      scrollAnimation.updatePlaybackRate(hoverMultiplier);
    };
    const handleMouseLeave = () => {
      scrollAnimation.updatePlaybackRate(1);
    };

    const container = scrollRef.current.parentElement;
    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [hoverMultiplier]);

  return (
    <div className="w-full max-h-[180px] flex justify-center max-w-[600px]">
      {/* Film-strip container */}
      <div className={`${styles.horizontalContainer} w-full max-h-[180px]`}>
        <div
          ref={scrollRef}
          className={styles.scrollContainerH}
          style={{
            animationDuration: `${speed}s`,
          }}
        >
          {[...items, ...items].map((item, idx) => (
            <div
              key={idx}
              className="
                py-[40px]
                relative
                w-60 h-60           
                flex-shrink-0
                overflow-hidden
                border-r-2 border-[#475569]
                border-l-2 border-[#475569]
                rounded-md
              "
            >
              {item.type === "video" ? (
                <video
                  src={item.src}
                  autoPlay
                  muted
                  loop
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={item.src}
                  alt=""
                  className="w-full h-full object-cover absolute top-4 max-h-36"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
