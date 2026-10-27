# RotationRuler

Private controlled ruler input for fine rotation. Pointer drag values are clamped to `min` / `max` and quantized to `step`. Keyboard arrow changes are clamped to `min` / `max` and increment or decrement by `step` (or `step / 2` with Shift).

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

## Keyboard

-   Left / Down: decrement by `step`.
-   Right / Up: increment by `step`.
-   Shift + arrow: use half the configured `step`.
-   Home / End: move to min / max.
-   PageUp / PageDown: use native range input behavior.
