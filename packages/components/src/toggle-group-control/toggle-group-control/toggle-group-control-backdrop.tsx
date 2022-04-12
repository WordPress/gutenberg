/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { useReducedMotion } from 'framer-motion';

/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ToggleGroupControlBackdropProps } from '../types';
import { useToggleGroupControlContext } from '../context';
import { CONFIG } from '../../utils';
import { AnimatedBackdrop } from './styles';

const TRANSITION_CONFIG = {
	type: 'tween',
	ease: [ 0.25, 0.1, 0.25, 1 ],
	// Transition durations in the config are expressed as a string in milliseconds,
	// while `framer-motion` needs them as integers in seconds.
	duration: parseInt( CONFIG.transitionDurationFast, 10 ) / 1000,
};

function ToggleGroupControlBackdrop( {
	containerSizes: { width: containerWidth },
}: ToggleGroupControlBackdropProps ) {
	const shouldReduceMotion = useReducedMotion();
	const { activeIndex, length } = useToggleGroupControlContext();

	containerWidth ??= 0;
	const width = containerWidth / length;
	const x = `${ activeIndex * width }px`;

	return activeIndex >= 0 ? (
		<AnimatedBackdrop
			role="presentation"
			transition={
				shouldReduceMotion
					? {
							...TRANSITION_CONFIG,
							duration: 0,
					  }
					: TRANSITION_CONFIG
			}
			animate={ { width, x } }
			initial={ false }
		/>
	) : null;
}

export default memo( ToggleGroupControlBackdrop );
