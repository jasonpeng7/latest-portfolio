import "./globals.css";

export const metadata = {
  title: "Jason Peng",
  description:
    "Official portfolio of Jason Peng, a software engineer specializing in web development and full-stack applications.",
  keywords:
    "Jason Peng, Software Engineer, UC Davis, Web Developer, Full Stack Developer, Portfolio, React, Next.js, JavaScript, TypeScript",
  authors: [{ name: "Jason Peng" }],
  creator: "Jason Peng",
  publisher: "Jason Peng",
  robots: "index, follow",
  openGraph: {
    title: "Jason Peng",
    description:
      "Official portfolio of Jason Peng, a software engineer specializing in web development and full-stack applications.",
    url: "https://jasonpe.com",
    siteName: "Jason Peng Portfolio",
    images: [
      {
        url: "/jason.jpg",
        width: 400,
        height: 400,
        alt: "Jason Peng, Software Engineer",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jason Peng | Software Engineer Portfolio",
    description:
      "Official portfolio of Jason Peng, a software engineer specializing in web development and full-stack applications",
    images: ["/jason.jpg"],
  },
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/logo.svg" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <link rel="manifest" href="/manifest.json" />

        {/* Canonical URL - Use non-www version */}
        <link rel="canonical" href="https://jasonpe.com" />

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
                "Official portfolio of Jason Peng, a software engineer specializing in web development and full-stack applications.",
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
