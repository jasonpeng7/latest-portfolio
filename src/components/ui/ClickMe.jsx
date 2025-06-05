import React from "react";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";

export default function ClickMeBounce() {
  return (
    <motion.div
      className="absolute left-8 md:left-32 lg:left-0 flex flex-col items-center text-dark_navy font-bold text-base leading-none"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="red-hat-bold text-dark-navy">L</div>
      <div className="red-hat-bold text-dark-navy">E</div>
      <div className="red-hat-bold text-dark-navy">A</div>
      <div className="red-hat-bold text-dark-navy">R</div>
      <div className="red-hat-bold text-dark-navy">N</div>
      <div className="red-hat-bold text-dark-navy">M</div>
      <div className="red-hat-bold text-dark-navy">O</div>
      <div className="red-hat-bold text-dark-navy">R</div>
      <div className="red-hat-bold text-dark-navy">E</div>
      <div className="red-hat-bold text-dark-navy">
        <FiArrowRight />
      </div>
    </motion.div>
  );
}
