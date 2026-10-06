"use client";
import dynamic from "next/dynamic";
const Desktop = dynamic(() => import("@/lib/os/components/os/Desktop"), { ssr: false, loading: () => <div className="os-loading">Starting JasonOS...</div> });
export default function DesktopRoute() {
  return <main className="jason-os"><Desktop /></main>;
}
