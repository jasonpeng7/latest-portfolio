// src/components/ui/PhotoBlog.jsx
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function PhotoBlog({ photos }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
      {photos.map((src, idx) => (
        <motion.div
          key={idx}
          className="w-full overflow-hidden rounded-md"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="w-[300px] h-[400px] sm:w-full sm:h-[400px] sm:max-h-[400px]">
            <Image
              src={src}
              alt={`Photo ${idx + 1}`}
              width={300}
              height={400}
              className="w-full h-full object-cover rounded-md"
              priority
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
