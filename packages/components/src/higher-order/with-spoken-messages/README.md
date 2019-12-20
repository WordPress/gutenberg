# withSpokenMessages

## Usage

```jsx
import { withSpokenMessages, Button } from '@wordpress/components';

const MyComponentWithSpokenMessages = withSpokenMessages( ( { speak, debouncedSpeak } ) => (
	<div>
		<Button isSecondary onClick={ () => speak( 'Spoken message' ) }>Speak</Button>
		<Button isSecondary onClick={ () => debouncedSpeak( 'Delayed message' ) }>Debounced Speak</Button>
	</div>
) );
```
