"use client";

import { useRef, useState } from "react";
import { Intro } from "@/components/features/introCMPNT";
import { InfiniteMovingCardsDemo } from "@/components/ui/movingcardsCMPNT";
import LoadingOverlay from "@/components/features/loadscreenCMPNT";
import TerminalContact from "@/components/features/contactCMPNT";
import TypeWriter from "@/components/features/aboutmeCMPNT";
import { ThemeProvider } from "@/components/ui/themecontext";
import { FramerContainer } from "@/components/features/framercontainerCMPNT";
import Footer from "@/components/features/footerCMPNT";
import CustomTag from "@/components/ui/header-tag";
import VerticalCarouselPage from "@/components/ui/vertCarousel";
import ExperienceList from "@/components/ui/experience-card";
import ProjectShowcase from "@/components/ui/projects";
import LiquidSideNav from "@/components/features/menuCMPNT";
import HorizontalCarouselPage from "@/components/ui/horzCarousel";

import { motion } from "framer-motion";
import { slideInLeft, slideInRight, liftUp } from "@/utils/motionVariants";

function App() {
  const scrollTop = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const homeRef = useRef(null);
  const contactRef = useRef(null);
  const abtmeRef = useRef(null);
  const projectRef = useRef(null);
  const bgRef = useRef(null);

  const scrollToTop = () => {
    setIsOpen(false);
    scrollTop.current.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <ThemeProvider className="p-[10px]">
      <div className="fixed inset-0 flex justify-center items-start">
        <LoadingOverlay className="absolute inset-0" />

        <FramerContainer>
          <div className="w-full max-w-[1000px] mx-auto flex flex-col">
            <div>
              <LiquidSideNav
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                scrollToTop={scrollToTop}
                scrollToSection={scrollToSection}
                refs={{ homeRef, contactRef, bgRef, abtmeRef, projectRef }}
              />
            </div>
            <main className="w-full">
              {/* Intro */}
              <motion.section
                ref={scrollTop}
                className="w-full mb-[50px] md:mb-[100px] flex flex-col lg:flex-row"
                variants={slideInLeft}
                initial="hidden"
                animate="visible"
                transition={{ delay: 3, duration: 0.7 }}
              >
                <div className=" flex flex-col xl:flex-row lg:flex-row items-center min-h-96 w-full">
                  <Intro />
                </div>
              </motion.section>

              {/* Tech Stack */}
              <motion.section
                className="mb-[50px] md:mb-[100px] mx-[15px] xl:mx-[0px] space-y-[30px]"
                variants={liftUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 3.2, duration: 0.6 }}
              >
                <CustomTag header={"Tech Stack"} />
                <InfiniteMovingCardsDemo />
              </motion.section>

              {/* About Me */}
              <motion.section
                className="mb-[50px] md:mb-[100px] flex flex-col justify-center items-center space-y-[30px] mx-[15px] xl:mx-[0px]"
                variants={slideInRight}
                initial="hidden"
                animate="visible"
                transition={{ delay: 3.4, duration: 0.7 }}
              >
                <article ref={abtmeRef} className="self-start">
                  <CustomTag header={"About me"} />
                </article>
                {/*  */}
                <article className="flex flex-col lg:flex-row justify-center items-center space-y-5 md:space-y-0 w-full md:space-x-5 max-w-[1200px] mx-auto">
                  <div className="w-full flex justify-center self-center mb-[20px]">
                    <TypeWriter />
                  </div>
                  <div className="block lg:hidden">
                    <HorizontalCarouselPage />
                  </div>

                  <div className="hidden lg:block">
                    <VerticalCarouselPage />
                  </div>
                </article>
              </motion.section>

              {/* Experience */}
              <motion.section
                ref={bgRef}
                className="mb-[50px] md:mb-[100px] mx-[15px] xl:mx-[0px] space-y-[30px]"
                variants={liftUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6 }}
              >
                <CustomTag header={"Experience"} />
                <ExperienceList />
              </motion.section>

              {/* Projects */}
              <motion.section
                ref={projectRef}
                className="mb-[50px] md:mb-[100px] space-y-[30px]  mx-auto flex flex-col justify-center items-center px-[16px] xl:px-[0px]"
                variants={slideInLeft}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7 }}
              >
                <article className="self-start">
                  <CustomTag header={"Projects"} />
                </article>
                <div className="w-full flex justify-center max-w-[850px]">
                  <ProjectShowcase />
                </div>
              </motion.section>

              {/* Contact Me */}
              <motion.section
                className="mx-[15px] xl:mx-[0px] space-y-[30px]"
                variants={slideInRight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <CustomTag header={"Contact Me"} />
                <div ref={contactRef} id="contact">
                  <TerminalContact />
                </div>
              </motion.section>
            </main>
          </div>

          <Footer />
        </FramerContainer>
      </div>
    </ThemeProvider>
  );
}

export default App;
