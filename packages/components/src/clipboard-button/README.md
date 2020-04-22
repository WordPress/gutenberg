# ClipboardButton

With a clipboard button, users copy text (or other elements) with a single click or tap.

![Clipboard button component](https://wordpress.org/gutenberg/files/2019/07/clipboard-button-2-1.png)


## Usage

```jsx
import { ClipboardButton } from '@wordpress/components';
import { withState } from '@wordpress/compose';

const MyClipboardButton = withState( {
	hasCopied: false,
} )( ( { hasCopied, setState } ) => ( 
	<ClipboardButton
		isPrimary
		text="Text to be copied."
		onCopy={ () => setState( { hasCopied: true } ) }
		onFinishCopy={ () => setState( { hasCopied: false } ) }
	>
		{ hasCopied ? 'Copied!' : 'Copy Text' }
	</ClipboardButton>
) );
```
