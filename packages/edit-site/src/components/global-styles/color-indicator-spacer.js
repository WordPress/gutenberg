/**
 * WordPress dependencies
 */
import {
	ColorIndicator,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';

// Compensate for the fact that `ColorIndicator` has a height of 20px,
// while all other icons have a height of 24px.
function ColorIndicatorWithSpacer( colorIndicatorProps ) {
	return (
		<Spacer
			paddingY={ 0.5 }
			marginBottom={ 0 }
			// Necessary to avoid extra vertical white space, since `ColorIndicator`
			// is a `display: inline-block` component.
			style={ { fontSize: 0 } }
		>
			<ColorIndicator { ...colorIndicatorProps } />
		</Spacer>
	);
}

export default ColorIndicatorWithSpacer;
