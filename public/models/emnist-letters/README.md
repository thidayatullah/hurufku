# EMNIST letters model

Place a TensorFlow.js GraphModel in this folder:

- model.json
- one or more *.bin weight shards referenced by model.json

Expected model contract used by HurufPad:

- Input: [1, 28, 28, 1] float32
- Output: logits or probabilities for letter classes
- Preferred classes: EMNIST ByClass (62 classes: 0-9, A-Z, a-z)

Preprocess used in app before inference:

- Strokes are rasterized to 28x28 grayscale
- Ink is inverted
- Image is rotated 90 degrees clockwise
- Image is flipped horizontally

The recognition pipeline filters predictions to letters only (A-Z / a-z) and ignores digits.

Add license and attribution details here when model files are added.
