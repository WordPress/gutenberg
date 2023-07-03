/**
 * External dependencies
 */
import { LayoutAnimation } from 'react-native';

const ANIMATION_DURATION = 300;

export function performLayoutAnimation( duration = ANIMATION_DURATION ) {
	LayoutAnimation.configureNext(
		LayoutAnimation.create(
			duration,
			LayoutAnimation.Types.easeInEaseOut,
			LayoutAnimation.Properties.opacity
		)
	);
}
