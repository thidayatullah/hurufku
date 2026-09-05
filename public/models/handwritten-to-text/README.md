# Handwritten-to-text model

Keras CTC handwriting model from:

https://huggingface.co/spaces/Labiba429/handwritten_to_text

- Source revision: `6661be4eb695e815340aae7fb77be425075bff19`
- Source file: `ocr_model (1).h5`
- Declared Space license: OpenRAIL
- Converted with TensorFlow.js Converter 4.22.0

Conversion command:

```sh
tensorflowjs_converter \
  --input_format=keras \
  --output_format=tfjs_layers_model \
  "ocr_model (1).h5" \
  public/models/handwritten-to-text
```

Model contract:

- Input: `[batch, 256, 64, 1]` float32 grayscale
- Output: `[batch, time, 31]` CTC probabilities
- Labels 0-29: space, apostrophe, hyphen, A-Z, backtick
- Label 30: CTC blank

HurufPad only decodes uppercase A-Z. It does not apply a dictionary or language
model, so arbitrary letter strings remain valid. Verify the applicable full
OpenRAIL license terms before distributing the model outside this project.