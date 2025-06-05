// src/components/features/PhotoblogPage.jsx
import React from "react";
import PhotoBlog from "../ui/PhotoBlog";

const photos = [
  "/prsnl_waterfall.svg",
  "/prsnl_hike.svg",
  "/prsnl_library.svg",
  "/prsnl_tahoe.svg",
  "/prsnl_SF.svg",
  "/prsnl_kan.svg",
  "/prsnl_vancouver.svg",
  "/prsnl_bmarrow.svg",
  "/prsnl_waterbike.svg",
  "/prsnl_davis.svg",
  "/prsnl_mariokart.svg",
  "/prsnl_bridge.svg",
];

export default function PhotoblogPage() {
  return <PhotoBlog photos={photos} />;
}
