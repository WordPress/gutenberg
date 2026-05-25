# RotationRuler

Private controlled ruler input for fine rotation. Pointer and keyboard changes are clamped to `min` / `max` and quantized to `step`.

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
