import { useState } from "react";

export default function ExperienceCard({
  logoSrc,
  companyName,
  title,
  startDate,
  description,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const LogoElement =
    typeof logoSrc === "string"
      ? () => (
          <img
            src={logoSrc}
            alt={`${companyName} logo`}
            className="w-12 h-12 object-contain"
          />
        )
      : logoSrc;

  return (
    <div
      className="    
      w-full
      py-4 px-2 
      md:px-4
      shadow-[0px_-1px_0px_rgba(0,0,0,0.035),0px_1px_0px_rgba(0,0,0,0.035)]
      rounded-lg
     "
    >
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="flex-shrink-0">
          <LogoElement />
        </div>

        <div className="flex-1 mx-4">
          <div className="text-dark-navy font-semibold text-lg">
            {companyName}
          </div>
          <div className="text-gray-600 text-sm">{title}</div>
        </div>

        <div className="flex items-center space-x-1 text-gray-600 text-sm">
          <span>{startDate}</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? "transform rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      <div
        className={`
          mt-3 px-4 md:px-6 
          overflow-hidden 
          transition-[max-height] duration-300 ease-in-out
          ${isOpen ? "max-h-[500px]" : "max-h-0"}
        `}
      >
        <p className="text-gray-700 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
