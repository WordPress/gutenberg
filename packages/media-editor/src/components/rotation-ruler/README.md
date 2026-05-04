# RotationRuler

Private to `@wordpress/media-editor`. A horizontal ruler-slider for
fine-grained numeric values (used for fine-tune rotation in the media
editor toolbar). Drag the ruler to scrub; the current value sits under
a fixed center pointer with an always-visible bubble. A visually
hidden `<input type="range">` underneath provides keyboard access and
accessibility.

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

- **← / →** — ±step
- **Shift + ← / →** — ±step / 2
- **Home / End** — min / max
- **PageUp / PageDown** — ±10% of range (native input behaviour)
