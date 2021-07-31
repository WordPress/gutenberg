# ClipboardButton

With a clipboard button, users copy text (or other elements) with a single click or tap.

![Clipboard button component](https://wordpress.org/gutenberg/files/2019/07/clipboard-button-2-1.png)

## Usage

```jsx
import { ClipboardButton } from '@wordpress/components';
import { useState } from '@wordpress/compose';

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
