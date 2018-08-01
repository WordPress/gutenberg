# ClipboardButton

## Usage

```jsx
import { ClipboardButton } from '@wordpress/components';
import { withState } from '@wordpress/compose';

withState( {
	hasCopied: false,
} )( ( { hasCopied, setState } ) => ( 
	<ClipboardButton
		isPrimary
		text="WordPress"
		onCopy={ () => setState( { hasCopied: true } ) }
		onFinishCopy={ () => setState( { hasCopied: false } ) }
	>
		{ hasCopied ? 'Copied!' : 'Copy Text' }
	</ClipboardButton>
) )
```
