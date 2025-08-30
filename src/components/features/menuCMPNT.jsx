import { motion } from "framer-motion";

const LiquidSideNav = ({ scrollToTop }) => {
  return (
    <div className="max-h-fit fixed right-5 top-5 w-full pl-12 py-5 px-5 z-20">
      <div className="flex justify-between items-center text-white">
        <div className="max-h-fit fixed right-5 top-5 w-full pl-12 py-5 px-5 z-10">
          <div className="flex justify-between items-center text-white">
            <motion.button
              className="w-[75px]"
              onClick={scrollToTop}
              whileTap={{ scale: 0.7 }}
              aria-label="Return to top of page"
            >
              <img
                src="/logo.svg"
                alt="Jason Peng Portfolio Logo - Click to return to top"
                className=""
              />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidSideNav;
