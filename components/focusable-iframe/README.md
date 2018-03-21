Focusable Iframe
================

`<FocusableIframe />` is a component rendering an `iframe` element enhanced to support focus events. By default, it is not possible to detect when an iframe is focused or clicked within. This enhanced component uses a technique which checks whether the target of a window `blur` event is the iframe, inferring that this has resulted in the focus of the iframe.

## Usage

Use as you would a standard `iframe`, passing `onFocus` as the callback to be invoked when the iframe receives focus.

```jsx
import { FocusableIframe } from '@wordpress/components';

function MyIframe() {
	return (
		<FocusableIframe
			src="https://example.com"
			onFocus={ /* ... */ }
		/>
	);
}
```

## Props

Any props aside from those listed below will be passed to the `FocusableIframe` will be passed through to the underlying `iframe` element.

### `onFocus`

- Type: `Function`
- Required: No

Callback to invoke when iframe receives focus.

### `iframeRef`

- Type: `wp.element.Ref`
- Required: No

If a reference to the underlying DOM element is needed, pass `iframeRef` as the result of a `wp.element.createRef` called from your component.
