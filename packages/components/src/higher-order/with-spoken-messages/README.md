# withSpokenMessages

## Usage

```jsx
import { withSpokenMessages, Button } from '@wordpress/components';

const MyComponentWithSpokenMessages = withSpokenMessages( ( { speak, debouncedSpeak } ) => (
	<div>
		<Button isDefault onClick={ speak( 'Spoken message' ) }>Speak</Button>
		<Button isDefault onClick={ debouncedSpeak( 'Delayed message' ) }>Debounced Speak</Button>
	</div>
) );
```
