import { useState } from "react";
import { FiX } from "react-icons/fi";
import { motion } from "framer-motion";

const LiquidSideNav = ({ scrollToTop, scrollToSection, refs }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="max-h-fit fixed right-5 top-5 w-full pl-12 py-5 px-5 z-10">
      <div className="flex justify-between items-center text-white">
        <motion.div
          // starts 100% of its width off to the right, then slides in
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          transition={{ delay: 4, duration: 1, ease: "easeOut" }}
          className="max-h-fit fixed right-5 top-5 w-full pl-12 py-5 px-5 z-10"
        >
          <div className="flex justify-between items-center text-white">
            <motion.button
              className="w-[75px]"
              onClick={scrollToTop}
              whileTap={{ scale: 0.7 }}
            >
              <img src="/logo.svg" alt="JP Logo" className="" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LiquidSideNav;
