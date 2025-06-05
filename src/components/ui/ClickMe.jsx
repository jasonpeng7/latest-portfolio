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
      <div className="red-hat-bold">L</div>
      <div className="red-hat-bold">E</div>
      <div className="red-hat-bold">A</div>
      <div className="red-hat-bold">R</div>
      <div className="red-hat-bold">N</div>
      <div className="red-hat-bold">M</div>
      <div className="red-hat-bold">O</div>
      <div className="red-hat-bold">R</div>
      <div className="red-hat-bold">E</div>
      <div className="red-hat-bold">
        <FiArrowRight />
      </div>
    </motion.div>
  );
}
