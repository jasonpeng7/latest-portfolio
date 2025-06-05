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

        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet"/>

        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet"/>
        <link href="index.css" rel="stylesheet"/>

        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
        <link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@300..900&display=swap" rel="stylesheet"/>

        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
        <link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@300..900&family=Raleway:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet"/>

        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
        <link href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Raleway:ital,wght@0,100..900;1,100..900&family=Red+Hat+Display:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet"/>

      </head>

      <body>
        {children}
      </body>
    </html>
  );
}
