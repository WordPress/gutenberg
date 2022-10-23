# withSpokenMessages

## Usage

```jsx
import { withSpokenMessages, Button } from '@wordpress/components';

const MyComponentWithSpokenMessages = withSpokenMessages(
	( { speak, debouncedSpeak } ) => (
		<div>
			<Button
				variant="secondary"
				onClick={ () => speak( 'Spoken message' ) }
			>
				Speak
			</Button>
			<Button
				variant="secondary"
				onClick={ () => debouncedSpeak( 'Delayed message' ) }
			>
				Debounced Speak
			</Button>
		</div>
	)
);
```
