# withFallbackStyles

## Usage

```jsx
import { withFallbackStyles, Button } from '@wordpress/components';

const { getComputedStyle } = window;

const MyComponentWithFallbackStyles = withFallbackStyles(
	( node, ownProps ) => {
		const buttonNode = node.querySelector( 'button' );
		return {
			fallbackBackgroundColor: getComputedStyle( buttonNode )
				.backgroundColor,
			fallbackTextColor: getComputedStyle( buttonNode ).color,
		};
	}
)( ( { fallbackTextColor, fallbackBackgroundColor } ) => (
	<div>
		<Button variant="primary">My button</Button>
		<div>Text color: { fallbackTextColor }</div>
		<div>Background color: { fallbackBackgroundColor }</div>
	</div>
) );
```
