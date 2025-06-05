import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <div className="h-24 shadow-[0_0_32px_rgba(34,_42,_53,_0.15),_0_4px_4px_rgba(0,_0,_0,_0.1),_0_0_0_2px_rgba(34,_42,_53,_0.1),_0_0_8px_rgba(34,_42,_53,_0.2),_0_20px_80px_rgba(47,_48,_55,_0.1),_0_1px_0_rgba(255,_255,_255,_0.15)_inset]">
      <div className="flex raleway_regular text-dark_navy p-4 items-center justify-center text-center h-full">
        <p className="mr-[2]">Built by</p>
        <a
          href="https://www.linkedin.com/in/iamjasonpeng7/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Jason Peng
        </a>
        <p>© {year}</p>
      </div>
    </div>
  );
}
