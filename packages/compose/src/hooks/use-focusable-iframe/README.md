# useFocusableIframe

By default, it is not possible to detect when an iframe is focused or clicked
within. This hook uses a technique which checks whether the target of a window
`blur` event is the iframe, inferring that this has resulted in the focus of the
iframe. It dispatches an emulated
[`FocusEvent`](https://developer.mozilla.org/en-US/docs/Web/API/FocusEvent) on
the iframe element with event bubbling, so a parent component binding its own
`onFocus` event will account for focus transitioning within the iframe.

## Usage

Use with an `iframe`. You may pass `onFocus` directly as the callback to be
invoked when the iframe receives focus, or on an ancestor component since the
event will bubble.

```jsx
import { useFocusableIframe } from '@wordpress/compose';

const MyFocusableIframe = () => {
    return(
        <iframe
            ref={ useFocusableIframe() }
            src="/my-iframe-url"
            onFocus={ () => console.log( 'iframe is focused' ) }
        />
    );
};
```
