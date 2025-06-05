import VerticalCarousel from "./vertical-carousel";

const mediaItems = [
  { type: "image", src: "/friends.png" },
  { type: "image", src: "/jason.png" },
  { type: "image", src: "/snowboard.png" },
  { type: "image", src: "/clerk.png"},
  { type: "image", src: "/crithmath.png"},
  { type: "image", src: "/retreat.png"},
  { type: "image", src: "/woodstocks.png"},
];

export default function VerticalCarouselPage() {
  return <VerticalCarousel items={mediaItems} speed={30} />;
}
