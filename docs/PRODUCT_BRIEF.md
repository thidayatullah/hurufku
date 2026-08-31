# ReadCanvas — product brief

## Overview

ReadCanvas is a large shared canvas for preschool reading: kids scribble letters with a marker (finger/mouse) or type them, the app turns each scribble into a real letter they can move, resize, recolor, and restyle. They line letters up into bits of language (BA, BABA, ABA). A teacher can say how it sounds; a Speak action can also read a selection aloud.

v1 is a **browser app** (phones, cheap Android tablets, Chromebooks, PCs) so families and classrooms are not locked to iPad.

## Audience

- Preschool teachers (classroom or small group), on whatever device the school already has.
- Children ~3–6, with a teacher or on their own at home.

## Primary benefits / features (v1)

- **Marker + keyboard:** draw a letter or type it; both become the same kind of letter object.
- **Scribble → letter:** after a short pause (so multi-stroke letters like E, T, K can finish), an on-device model guesses A–Z / a–z. Optional “I’m done.” If the model is unsure, a short picker (e.g. B or D).
- **Interact:** move, resize, color, font. Drag into order.
- **Speak selection:** selected letters are read left-to-right in the current language (English or Indonesian). Same Latin glyphs; different TTS voice.
- **Last session:** restore the last board on this device. No login.

**Out of v1:** accounts, cloud sync, teacher dashboard, full-word OCR, phonics curriculum, digits, native iOS app, sending writing to a cloud OCR API.

## Tech / architecture (v1)

- **Stack:** React + TypeScript + Vite. 2D canvas of letter objects (e.g. Konva). Static host; no backend required.
- **PWA:** add to home screen; cache app + letter model so the canvas can work offline after first load.
- **Recognition:** on-device only (TensorFlow.js or ONNX Runtime Web; EMNIST-style A–Z). Writing never leaves the device. Accuracy is lower than cloud OCR; picker covers misses.
- **TTS:** Web Speech API (`speechSynthesis`), language from the EN/ID toggle. Voice quality depends on the OS/browser (Indonesian is uneven on some devices).
- **Persistence:** `localStorage` / IndexedDB for the last board.

Ink → pause → on-device letter model → letter on canvas. Keyboard skips recognition and drops a letter on the board. Speak reads the selection.
