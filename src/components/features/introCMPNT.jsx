import React from "react";
import { motion, useAnimation } from "framer-motion";
import Image from "next/image";

export function Intro() {
  const controls = useAnimation();

  return (
    <div className="flex items-center justify-center w-full lg:flex-row flex-col px-4 md:px-10 lg:px-20 gap-8 lg:gap-12 p-0 md:p-20">
      <div className="flex flex-col items-center lg:items-start space-y-4 text-left w-full lg:w-1/2 max-w-lg">
        <h1
          className="red-hat-extrabold bg-clip-text text-transparent bg-dark-navy 
        text-4xl md:text-5xl lg:text-6xl 2xl:text-7xl py-2 md:py-4 tracking-tight text-center lg:text-left"
        >
          My name is, <br /> Jason Peng.
        </h1>
        <p className="red-hat-normal text-neutral-grey-3 text-center lg:text-left max-w-xl text-sm md:text-lg">
          <span className="font-bold">Fullstack</span> developer and passionate
          computer science student in love with building impactful software. My
          work mainly focuses on{" "}
          <span className="font-bold">web development</span> from design and
          coding,<span className="font-bold">mobile development</span>, and{" "}
          <span className="font-bold">backend systems</span>.
        </p>
        <div className="flex flex-row items-center justify-center lg:justify-start space-x-4 mb-4 w-full">
          <button>
            <a
              href="https://github.com/jasonpeng7"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit Jason Peng's GitHub profile"
            >
              <Image
                src="/github-mark.svg"
                alt="GitHub logo - Visit Jason Peng's GitHub profile"
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
              aria-label="Visit Jason Peng's LinkedIn profile"
            >
              <Image
                src="/linked-in.svg"
                alt="LinkedIn logo - Visit Jason Peng's LinkedIn profile"
                width={30}
                height={30}
              />
            </a>
          </button>
        </div>
      </div>
      {/* Image */}
      <div className="flex justify-center items-center w-full lg:w-1/2">
        <motion.div
          animate={controls}
          className="w-full max-w-[400px] md:max-w-[500px] lg:max-w-[600px] focus:outline-none"
        >
          <Image
            src="/jason.jpg"
            width={400}
            height={400}
            alt="Jason Peng, Software Engineer and Full Stack Developer"
            className="object-contain w-full h-auto rounded-full"
            priority
          />
        </motion.div>
      </div>
    </div>
  );
}
