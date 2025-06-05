"use client";

import React, { useEffect, useRef } from "react";
import styles from "@/app/VerticalCarousel.module.css";

export default function VerticalCarousel({ items, speed = 10 }) {
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
    <div className="w-full max-w-[550px] flex justify-end">

      <div className={`${styles.carouselResponsiveContainer} md:max-h-64 ml-auto`}>
        <div
          ref={scrollRef}
          className={styles.scrollContainer}
          style={{
            animationDuration: `${speed}s`,
          }}
        >
          {[...items, ...items].map((item, idx) => (
            <div
              key={idx}
              className="w-60 h-40 flex-shrink-0 mx-auto rounded-md overflow-hidden"
            >
              {item.type === "video" ? (
                <video
                  src={item.src}
                  autoPlay
                  muted
                  loop
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <img
                  src={item.src}
                  alt=""
                  className="w-full h-full object-cover rounded-lg"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
