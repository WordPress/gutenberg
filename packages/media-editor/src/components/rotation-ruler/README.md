# RotationRuler

Private to `@wordpress/media-editor`. A horizontal ruler-slider for
fine-grained numeric values (used for fine-tune rotation in the media
editor toolbar). Drag the ruler to scrub; the current value is shown
in an active label sitting over the centered pointer triangle, with
labelled major ticks running through the strip behind it. A visually
hidden `<input type="range">` underneath provides keyboard access and
accessibility. Drag values quantize to multiples of `step`.

## Usage

```tsx
<RotationRuler
    value={ rotation }
    onChange={ setRotation }
    label={ __( 'Fine rotation' ) }
    min={ -45 }
    max={ 45 }
/>
```

## Props

See `index.tsx` for the full `RotationRulerProps` interface. The
component is controlled (`value` / `onChange`); callers own state and
clamp/transform values as they wish before passing them in.

## Keyboard

- **← / ↓** — decrement by `step`
- **→ / ↑** — increment by `step`
- **Shift + arrow** — half-step (e.g. 0.5° when `step` is 1°), for
  keyboard precision when the integer drag-step is too coarse.
  **Shift + drag** does the same on the pointer.
- **Home / End** — min / max
- **PageUp / PageDown** — ±10% of range (native input behaviour)
