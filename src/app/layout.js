import "./globals.css";

export const metadata = {
  title: "Jason Peng",
  description: "My portfolio",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Favicon (optional) */}
        <link rel="icon" href="/logo.svg" />
        <link rel="manifest" href="/manifest.json" />

        <link
          href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
          rel="stylesheet"
        />

        <link
          href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
          rel="stylesheet"
        />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@300..900&display=swap"
          rel="stylesheet"
        />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@300..900&family=Raleway:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Raleway:ital,wght@0,100..900;1,100..900&family=Red+Hat+Display:ital,wght@0,300..900;1,300..900&display=swap"
          rel="stylesheet"
        />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Jason Peng",
              url: "https://jasonpe.com",
              jobTitle: "Software Engineer",
              description:
                "Fullstack developer and passionate computer science student in love with building impactful software.",
              image: "https://jasonpe.com/jason.jpg",
              sameAs: [
                "https://www.linkedin.com/in/iamjasonpeng7/",
                "https://github.com/jasonpeng7",
              ],
              knowsAbout: [
                "Web Development",
                "Full Stack Development",
                "React",
                "Next.js",
                "JavaScript",
                "TypeScript",
                "DevOps",
              ],
              alumniOf: {
                "@type": "Organization",
                name: "Computer Science Student",
              },
            }),
          }}
        />

        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Jason Peng Portfolio",
              url: "https://jasonpe.com",
              description:
                "Official portfolio of Jason Peng, a software engineer specializing in web development, full-stack applications, and creative problem-solving.",
              author: {
                "@type": "Person",
                name: "Jason Peng",
              },
            }),
          }}
        />
      </head>

      <body>{children}</body>
    </html>
  );
}
