# Jason Peng — interactive portfolio

A 3D office with a fully local Windows 95-style portfolio inside the CRT monitor.
The white, centered Start page appears immediately and preloads the room and
embedded desktop behind a progress bar. Start becomes available only when both
are ready; the separate BIOS/loading page and its delayed transition are removed.
The workstation uses the supplied IBM 5150 GLB with its original computer textures,
a pale oak desk, black steel frame, and a slim matte-black LED ring pendant.
The room uses a modern warm-neutral palette inspired by the supplied interior:
creamy plaster, natural oak, ivory textiles, and crisp charcoal accents. Vertical
oak battens form the feature wall behind the shelves and bed; a woven ivory rug
softens the chair area. Neutral daylight fills the room, with warm local lamps.
The taller plant stays anchored to the floor; the left white brochure is removed.
The floor uses live shadows from the pendant instead of the old baked table shadow.
A tapered charcoal metal wastebasket sits near the back wall beneath the desk's left side.
Crumpled paper, a used cup, and a crushed can fill it; the floor starts clean.
The first click in Room, Desk, or Free Camera shakes it and spills all its contents.
The can tips while its actual contents slide over the rim, fall under gravity,
and tumble, bounce, and settle at varied spots on the floor, leaving
the bin empty. It runs once per page load; reduced motion empties it immediately.
A custom all-black [Fujifilm X-T30 II](https://www.fujifilm-x.com/global/products/cameras/x-t30-ii/)
with a [Tamron 17–70mm](https://www.tamron.com/global/consumer/lenses/b070/spec.html)
sits on the desk's left side, its lens angled left and its front branding visible.
Mobile Computer view fits the tilted screen with padding and updates on resize,
while the desktop zoom distance stays the same. The chair is hidden in mobile
Computer view so the wider framing cannot place it in front of the screen;
it returns in Room and Desk views.
The natural oak floor has long pale planks with subtle grain and staggered
joints. Four warm off-white plaster walls meet it at square edges, trimmed with
white painted baseboards and a small top cap. The floor stays flat up to the walls.
The enclosure contains the startup approach and the existing automatic camera
paths. Manual orbiting can turn through 360 degrees; its distance shortens near a
wall to keep the viewpoint inside with clearance, and zoom remains bounded.
Two minimal smoked-oak ledges, matching the slatted wall, hold six textured vinyl sleeves;
they sit to the monitor's left so both rows are visible from Room and Desk.
Two staggered floating shelves occupy the rear-wall gap between the desk and bed,
using the bed frame's dark-brown material. The unlit top shelf holds Lakers and
Dodgers baseball caps; the lower shelf holds LV Imagination and YSL MYSLF bottles.
Click either ledge or a sleeve to zoom into the collection, then click a record
to lift that sleeve off its ledge into a close-up, without an instructional popup.
VINYL also supports keyboard navigation. BACK or Escape returns the sleeve to its exact
spot on the shelf; a second BACK returns to the previous room view.
Clicking outside a close-up returns to all records; clicking outside the collection
returns to Room. The baseboard stops at both edges of the slatted feature wall.
The covers are HEROES & VILLAINS, Graduation, Souled Out, Take Care, 1989 (original
2014 cover), and petal. Cover source links are in `public/room/textures/vinyl/SOURCES.md`.
The record shelves stay attached to the rear wall. Each record
uses a single textured sleeve mesh, filtered mipmaps, and increased camera depth
precision to avoid distant depth fighting and texture shimmer.
The original chair is replaced with a custom Aeron-style black mesh chair, a
five-star caster base, lumbar support, and brown walnut trim. Its geometry is built
locally in `src/lib/room/furniture.js`, inspired by the
[Herman Miller Aeron](https://www.hermanmiller.com/products/seating/office-chairs/aeron-chair/).
The surrounding room retains
the reference's baked models, camera positions, steam/screen shaders, and audio.
The OS shell is adapted from the linked inner-site
repository, preserving its windows, taskbar, shortcuts, fonts, and drag/resize UI.
The desktop includes My Showcase (with a J icon), Spotify95, Photos, and Credits.

## Run

```sh
npm install
npm run dev
```

Open the local URL shown by Next.js. `/` is the 3D experience; `/desktop` opens JasonOS
without WebGL. Use START to enter and click the room to approach the desk.
Camera buttons provide direct room, desk, and computer views. The Desk camera stays
fixed; click the monitor or COMPUTER to enter the monitor view.
Escape steps back from the monitor. Sound and free-camera controls are at the top left.
Click the Fujifilm camera in Room or Desk, or use CAMERA, to lift it off the table
and turn it around. The viewpoint approaches the rear body and the film plays
inside its physical LCD using a video texture attached to the camera. The clip
preloads independently of the room and plays inline, initially muted. Controls
provide play/pause, sound, replay, and Back. Back or Escape stops playback, reverses
the turn, lowers the camera onto the table, and returns to the originating view.
Narrow Desk views keep both the camera and computer visible. Camera framing adapts
to portrait, landscape, and viewport changes, and respects reduced-motion settings.
The film and player title are configured in `src/data/film.js`. The supplied
`IMG_9647 (1).mov` is stored as a browser-compatible H.264/AAC MP4 with fast start
at `public/films/through-my-lens.mp4`. The redundant Open 2D portfolio corner
button is hidden on mobile so the initial room prompt stays unobstructed.
Desktop shortcuts open on double-click or Enter, or one tap on touchscreens.
Touchscreen shortcuts use larger icons and labels, including inside the 3D CRT.
Window buttons minimize, maximize,
and close; taskbar tabs restore minimized windows.

## Content

Edit `src/data/portfolio.js` to update the bio, social links, skills, experience, projects,
and galleries. Content was migrated from the existing portfolio without inventing
credentials or project results. The IBM description and Spark Copilot project now
use Jason's supplied résumé. Spark Copilot has no public demo/repository link.
Degree details, location, availability, and a public résumé download remain omitted.
The About photo is the supplied Santorini portrait. Spark Copilot's conceptual hero
was generated with the built-in image tool; the prompt is in `docs/spark-copilot-art.md`.
The inconsistent UC Davis Mobile App project entry was omitted: its old description,
images, and link referred to different projects. The Unitrans work remains under ASUCD IRL.

The contact form uses a `mailto:` draft addressed to `jiapeng@ucdavis.edu`.
It needs the visitor's email application; no third-party contact backend is configured.
The OS uses the original Adobe Typekit stylesheet for its display fonts, with local
Millennium and MSSansSerif fonts and system fallbacks.
The monitor loads `/desktop?embedded=1` on the same origin.

## Photos

Photos is a local retro gallery with album filters, title/place search, and a
full-size viewer with previous/next controls. The Travel album includes Jason's
three supplied photos: Greek Flag, Blue Domes, and Harbor Boats.

1. Put optimized JPEG, PNG, or WebP images in `public/photos/`.
2. Add entries to `src/data/photos.js`, using unique IDs and public image paths:

```js
export const photos = [
  {
    id: "coast-01",
    src: "/photos/coast.jpg",
    title: "Along the coast",
    alt: "Blue sea beneath a coastal village",
    album: "Travel",
    location: "Santorini, Greece",
    date: "2026-09-01",
  },
];
```

`album`, `location`, and `date` are optional. Album names create sidebar buttons
automatically. Visitors can browse the collection in both 2D and 3D;
the collection is maintained in the repository. Commit and deploy to publish new photos.

## Spotify95

Spotify95 is a retro music window with Jason's supplied playlist, a library sidebar,
and a separate Now Listening view. Playback uses the official Spotify Embed, with
the necessary media permissions on both the player and the outer 3D monitor iframe.
Visitors press play themselves; available previews/full playback and sign-in prompts
are controlled by Spotify. Closing the window stops its player; minimizing keeps it alive.
Change only the playlist URL in `src/data/music.js`. Spotify95 retrieves the matching
title and cover from Spotify oEmbed automatically; metadata is cached per playlist
for five minutes. Reload Player also refreshes the app's metadata. If metadata is
unavailable, a neutral record sleeve appears and playlist playback still works.

The playlist works without API credentials. Live listening activity is optional and
requires Jason to authorize his account:

1. Create a Spotify developer application at https://developer.spotify.com/dashboard
   and register `http://127.0.0.1:4387/callback` as a redirect URI.
2. Add `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` to the ignored `.env.local` file
   using `.env.example` as a reference. Keep these values private.
3. Run `npm run spotify:connect`, open the terminal's authorization URL, and authorize
   Jason's Spotify account. The local helper saves the refresh token to `.env.local`.
4. Restart `npm run dev`. For deployment, add the same three private environment
   variables to the hosting provider and rebuild/restart the server.

The server reads only currently playing activity (`user-read-currently-playing`).
It caches results for 20 seconds and respects Spotify rate limits; the desktop polls
every 30 seconds while visible. No token or device-control endpoint is sent to visitors.
Changing Jason's track never interrupts the visitor's player; they choose whether to
listen to that track. Until the account is connected, Now Listening displays an honest
offline state and the playlist remains available.
See Spotify's [Embeds documentation](https://developer.spotify.com/documentation/embeds)
and [currently playing endpoint](https://developer.spotify.com/documentation/web-api/reference/get-the-users-currently-playing-track).

## Validation

```sh
npm run build
npm run lint
npm run test:camera
npm run test:loading
npm run test:preview
npm run test:music
```

Development output uses `.next-dev`; production builds use `.next` so validation
does not interrupt a running preview or the desktop embedded in its monitor.

## Attribution

3D reference: https://github.com/henryjeff/portfolio-website
OS reference: https://github.com/henryjeff/portfolio-inner-site
Original 3D license: `src/lib/room/LICENSE.md`.
The original design acknowledgement remains in the OS Credits window;
model and license provenance is retained here and in the source attribution files.
Bed Agape: Render - City, supplied by Jason, licensed CC BY 4.0.
Source: https://sketchfab.com/3d-models/bed-agape-96ed3f6ba55848809dfa8cd505edddae
License: http://creativecommons.org/licenses/by/4.0/
Stored at `public/room/models/Bed/bed_agape.glb`; embedded textures and model metadata
are retained. The model is scaled and placed beside the desk, with a procedural
lamp added to its integrated nightstand. Click or tap the lamp to toggle its warm
light. Its illumination and shadows fade together, independently of the desk light.
The Don Toliver comic poster above the bed is cleaned from Jason's supplied
reference; its asset and cleanup prompt are in `public/room/textures/posters/`.
IBM 5150 workstation: DoZ84. The supplied GLB embeds the source
https://sketchfab.com/3d-models/ibm-5150-986cafe13c144d0893a405863756f341
and lists its license as Sketchfab Standard. It is stored at
`public/room/models/Computer/ibm_5150.glb`; its original embedded textures are retained.
The reference websites' personal content, résumé, analytics, and contact API are not used.
