# وكالة الوسائط الذكية — Smart Media website

Bilingual (Arabic / English) agency website with light and dark mode, animations and page transitions.
All text, prices, images and contact details live in `content/` and `media/`, so they can be edited
without touching the code, either directly or through [Pages CMS](https://pagescms.org).

## Structure

```
.
├── index.html            Page layout (template) — loads the CSS, JS and content
├── .pages.yml            Pages CMS configuration (what can be edited in the dashboard)
├── README.md             This file
├── content/
│   ├── ar.json           All Arabic text
│   ├── en.json           All English text
│   └── settings.json     Phone, WhatsApp, X username, button color, default language/mode
├── media/
│   ├── logo.png          Logo (round)
│   └── logo-rays.svg     Logo rays (vector) used as the background art
└── assets/
    ├── css/style.css     All styles, colors and animations
    └── js/
        ├── app.js        Site logic (language, mode, slides, filters, transitions, form)
        ├── template.js   Fills the template in index.html with the content
        └── vendor/morphdom.min.js   Small library that updates the page smoothly
```

## Editing content

### With Pages CMS (recommended)
1. Push this folder to a GitHub repository.
2. Sign in at [app.pagescms.org](https://app.pagescms.org) with GitHub and open the repository.
3. You'll see **Settings / الإعدادات**, **المحتوى العربي** and **English content**.
   Edit the fields, upload images, and save. Each save is a commit to the repository.

### By hand
Open the JSON files in `content/` in any text editor and change the text between quotes.
Keep the quotes, commas and brackets as they are.

- Arabic and English are separate files: when you change something, change it in **both**.
- Placeholders in `[brackets]` (prices, numbers, story, reviews, FAQ answers) are waiting for real information.
- To add a project image: put the image in `media/` and set `"image": "media/your-image.jpg"` on the project in `work.items`.
- Client logos work the same way in `clients.logos`.
- Service icons can be: `web`, `ads`, `social`, `brand`, `video`, `seo`.
- Project filter groups can be: `web`, `social`, `brand`.

### Contact details (`content/settings.json`)
- `whatsapp`: full number with country code, digits only, e.g. `9665XXXXXXXX`.
  When set, the floating WhatsApp button opens a chat, and the **Send request** form opens WhatsApp
  with the customer's name, phone, chosen service and details already written in the message.
  While it's empty, both fall back to calling `phone`.
- `accentColor`: color of the main buttons.
- `defaultLanguage`: `ar` or `en`. `defaultTheme`: `dark` or `light`.

## Previewing on your computer

The site loads its text from `content/*.json`, which browsers block when you double-click
`index.html`. Open it through a small local web server instead, for example:

- **VS Code**: install the *Live Server* extension, right-click `index.html` → *Open with Live Server*.
- **Python**: in this folder run `python -m http.server`, then open http://localhost:8000

## Publishing

It's a static site, so any static host works:

- **GitHub Pages**: repository → Settings → Pages → deploy from the `main` branch, root folder.
- **Netlify / Cloudflare Pages**: connect the GitHub repository; no build command, publish directory is the root.

Connect your own domain in the host's settings. Every change saved in Pages CMS updates the live site
automatically when the host is connected to the repository.

## Notes
- Fonts load from Google Fonts (IBM Plex Sans Arabic, Readex Pro).
- Scroll animations use modern CSS (Chrome, Edge, Safari). Other browsers show the page without them.
- Visitors who turn on "reduce motion" on their device see the site without animations.
