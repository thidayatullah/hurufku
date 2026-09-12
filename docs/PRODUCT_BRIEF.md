# Hurufku — product brief

## Overview

Hurufku (*huruf* = letter, *-ku* = "my" in Indonesian) is a large shared canvas for preschool reading: kids draw with a marker (finger/mouse) or add letter stickers from a keyboard. Drawn scribbles become movable stickers they can arrange, recolor, and restyle. Letter stickers can be lined up into bits of language (BA, BABA, ABA). A teacher can say how it sounds; a Speak action can also read a letter-only selection aloud.

v1 is a **browser app** (phones, cheap Android tablets, Chromebooks, PCs) so families and classrooms are not locked to iPad.

## Audience

- Preschool teachers (classroom or small group), on whatever device the school already has.
- Children ~3–6, with a teacher or on their own at home.

## Primary benefits / features (v1)

- **Marker + keyboard:** draw freehand scribbles or add typed letter stickers.
- **Scribble stickers:** after a short pause, all strokes drawn close together become one movable sticker. Optional “Make sticker.”
- **Stroke styles:** pick stroke color, weight, and type (pencil, crayon, chalk, marker) before drawing; edit the same properties later in the inspector.
- **Interact:** move, resize, color, font for letters; move, color, stroke type, and stroke weight for scribbles. Drag into order.
- **Speak selection:** selected letters are read left-to-right in the current language (English or Indonesian). A selection containing a scribble cannot be spoken.
- **Last session:** restore the last board on this device. No login.

**Out of v1:** accounts, cloud sync, teacher dashboard, full-word OCR, letter OCR, phonics curriculum, digits, native iOS app, sending writing to a cloud OCR API.

## Tech / architecture (v1)

- **Stack:** React + TypeScript + Vite. 2D canvas of letter and scribble sticker objects (e.g. Konva). Static host; no backend required.
- **PWA:** add to home screen; cache the app so the canvas can work offline after first load.
- **Ink:** local only. Raw strokes are grouped by a short pause and saved as scribble stickers; no OCR model runs.
- **TTS:** Web Speech API (`speechSynthesis`), language from the EN/ID toggle. Voice quality depends on the OS/browser (Indonesian is uneven on some devices).
- **Persistence:** `localStorage` / IndexedDB for the last board.

Ink → pause → scribble sticker on canvas. Keyboard drops a letter sticker on the board. Speak reads letter-only selections.
