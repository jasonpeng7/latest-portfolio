import React from "react";
import { useState, useEffect } from "react";
import PersonalInfoModal from "../ui/PrsnlModal";
import { motion, useAnimation } from "framer-motion";
import ClickMeBounce from "../ui/ClickMe";
import Image from "next/image";

export function Intro() {
  const [showModal, setShowModal] = useState(false);
  const controls = useAnimation();

  const handleClick = async () => {
    await controls.start({
      scale: [1, 1.2, 1],
      rotate: [0, 15, -15, 0],
      transition: { duration: 0.4, ease: "easeInOut" },
    });

    setShowModal(true);
  };

  return (
    <div className="flex items-center justify-center w-full lg:flex-row flex-col px-10">
      <div className="flex flex-col items-center md:items-start lg:items-start xl:items-start 2xl:items-start space-y-4 text-left ">
        <h2
          className="red-hat-extrabold bg-clip-text text-transparent bg-dark-navy 
        text-5xl md:text-5xl lg:text-6xl 2xl:text-7xl py-2 md:py-10 tracking-tight"
        >
          My name is, <br /> Jason Peng.
        </h2>
        <p className="red-hat-normal text-neutral-grey-3 text-center md:text-left lg:text-left xl:text-left 2xl:text-left max-w-xl text-sm md:text-lg ">
          Fullstack developer and passionate computer science student in love
          with building impactful software.
        </p>
        <div className="flex flex-row items-center justify-center lg:justify-start space-x-4 mb-4 w-full">
          <button>
            <a
              href="https://github.com/jasonpeng7"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/github-mark.svg"
                alt="github-logo"
                width={30}
                height={30}
              />
            </a>
          </button>

          <button>
            <a
              href="https://www.linkedin.com/in/iamjasonpeng7/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/linked-in.svg"
                alt="linkedin-logo"
                width={30}
                height={30}
              />
            </a>
          </button>
        </div>
      </div>
      {/* SVG Image */}
      <div className="flex justify-center items-center h-3/4 w-1/3 block lg:relative ">
        <ClickMeBounce />
        <motion.button
          onClick={handleClick}
          onHoverStart={() =>
            controls.start({
              scale: 1.05,
              rotate: [0, 5, -5, 0],
              transition: { duration: 0.3, ease: "easeInOut" },
            })
          }
          animate={controls}
          initial={{ scale: 1, rotate: 0 }}
          className="min-w-[400px] max-w-[700px] sm:min-w-[500px] sm:max-w-[800px] self-center focus:outline-none"
        >
          <img
            src="/me2.svg"
            alt="me-svg"
            className="object-contain w-full h-auto"
          />
        </motion.button>
      </div>
      <PersonalInfoModal
        visible={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
