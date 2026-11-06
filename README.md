# Learning Module Books

A tiny, zero-backend web app for organizing your YouTube videos into learning modules (mini-courses).

## Features
- Create modules with a title and description.
- Add lessons by pasting any YouTube URL (`youtube.com/watch?v=…`, `youtu.be/…`, `/shorts/…`, `/embed/…`) or a bare 11-char video ID.
- Embedded player (privacy-enhanced `youtube-nocookie.com`), notes per lesson, reorder, delete.
- Progress bar per module, checkboxes to mark lessons complete.
- Everything is saved to your browser's `localStorage`. Use **Export** / **Import** to back up or move between devices.
- Light/dark theme follows your OS.

## Run locally
It's a static site — just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

Then visit http://localhost:8080.

## Deploy
Drop the folder on any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3, etc.). No build step.

## Notes
- "Uploading" here means embedding your YouTube videos by URL — the videos themselves stay on YouTube, which handles hosting and playback. If you need to upload raw video files to your own storage, that's a different app shape (server + storage) — let me know and I'll scaffold it.
