export default function CustomTag({ header }) {
  return (
    <div className="inline-flex items-center bg-transparent border border-slated-500 px-3 py-1 rounded-lg ">
      <span className="text-gray-700 text-sm font-medium tracking-wide">
        {header}
      </span>
    </div>
  );
}
