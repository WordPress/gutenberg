/**
 * External dependencies
 */
import { LayoutAnimation } from 'react-native';

const ANIMATION_DURATION = 150;

export function performLayoutAnimation( duration = ANIMATION_DURATION ) {
	LayoutAnimation.configureNext( {
		duration,
		update: {
			type: LayoutAnimation.Types.linear,
			property: LayoutAnimation.Properties.opacity,
		},
		create: {
			type: LayoutAnimation.Types.linear,
			property: LayoutAnimation.Properties.opacity,
		},
	} );
}
