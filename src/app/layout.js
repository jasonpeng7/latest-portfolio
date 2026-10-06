import "./globals.css";
import "@/lib/os/os.css";
import "@/lib/os/personal.css";
import "@/lib/os/spotify.css";
import "@/lib/os/photos.css";
import { profile } from "@/data/portfolio";
export const metadata = {
  metadataBase: new URL(profile.website),
  title: "Jason Peng | Interactive Portfolio",
  description: "Step into Jason Peng’s interactive 3D portfolio. Explore fullstack web projects, mobile apps, and software engineering experience.",
  keywords: ["Jason Peng", "Software Engineer", "Fullstack Developer", "UC Davis", "Interactive Portfolio", "React", "Next.js", "TypeScript"],
  authors: [{ name: profile.name }], creator: profile.name,
  alternates: { canonical: profile.website },
  icons: { icon: "/logo.svg", apple: "/logo.svg" }, manifest: "/manifest.json",
  openGraph: { title: "Jason Peng | Interactive Portfolio", description: profile.bio, url: profile.website, siteName: "Jason Peng Portfolio", locale: "en_US", type: "website", images: [{ url: profile.portrait, alt: "Jason Peng" }] },
  twitter: { card: "summary_large_image", title: "Jason Peng | Interactive Portfolio", description: profile.bio, images: [profile.portrait] },
};
export const viewport = { width: "device-width", initialScale: 1, themeColor: "#3e9697" };
export default function RootLayout({ children }) {
  const person = { "@context": "https://schema.org", "@type": "Person", name: profile.name, url: profile.website, jobTitle: profile.title, description: profile.bio, image: `${profile.website}${profile.portrait}`, sameAs: [profile.github, profile.linkedin] };
  return <html lang="en"><body>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person).replace(/</g, "\\u003c") }} /></body></html>;
}
