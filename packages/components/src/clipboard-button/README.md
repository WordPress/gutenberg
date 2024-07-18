# ClipboardButton

<div class="callout callout-alert">
This component is deprecated. Please use the `useCopyToClipboard` hook from the `@wordpress/compose` package instead.
</div>

With a clipboard button, users copy text (or other elements) with a single click or tap.

![Clipboard button component](https://wordpress.org/gutenberg/files/2019/07/clipboard-button-2-1.png)

## Usage

```jsx
import { useState } from 'react';
import { ClipboardButton } from '@wordpress/components';

const MyClipboardButton = () => {
	const [ hasCopied, setHasCopied ] = useState( false );
	return (
		<ClipboardButton
			variant="primary"
			text="Text to be copied."
			onCopy={ () => setHasCopied( true ) }
			onFinishCopy={ () => setHasCopied( false ) }
		>
			{ hasCopied ? 'Copied!' : 'Copy Text' }
		</ClipboardButton>
	);
};
```

## Props

The component accepts the following props:

### className

The class that will be added to the classes of the underlying `<Button>` component.

- Type: `string`
- Required: no

### text

The text that will be copied to the clipboard.

- Type: `string`
- Required: yes

### onCopy

The function that will be called when the text is copied.

-- Type: `() => void`
-- Required: yes

### onFinishCopy

The function that will be called when the text is copied and the copy animation is finished.

-- Type: `() => void`
-- Required: no

### Inherited props

Any additional props will be passed the underlying `<Button/>` component. See the [Button](/packages/components/src/button/README.md#props) component for more details on the available props.
