# VisuallyHidden

A component used to render text intended to be visually hidden, but will show for alternate devices, for example a screen reader. This is simply a re-export of `reakit`'s `VisuallyHidden` wrapped with the standard `@wordpress/components` className. It also defaults to a `div` rather than the `span` that `reakit` prefers for backwards compatability.

### Usage

```jsx
<VisuallyHidden> Show text for screenreader. </VisuallyHidden>
```
