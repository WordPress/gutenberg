/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { useReducedMotion } from 'framer-motion';

/**
 * Internal dependencies
 */
import type { ToggleGroupControlBackdropProps } from '../types';
import { CONFIG } from '../../utils';
import { AnimatedBackdrop, inset } from './styles';

const TRANSITION_CONFIG = {
	type: 'tween',
	ease: [ 0.25, 0.1, 0.25, 1 ],
	// Transition durations in the config are expressed as a string in milliseconds,
	// while `framer-motion` needs them as integers in seconds.
	duration: parseInt( CONFIG.transitionDurationFast, 10 ) / 1000,
};

const sumToNth = ( list: number[], toIndex: number ) => {
	let sum = 0;
	for ( let i = toIndex; i > 0; sum += list[ --i ] );
	return sum;
};

export default function ToggleGroupControlBackdrop( {
	activeIndex = -1,
	optionSizes,
}: ToggleGroupControlBackdropProps ) {
	const shouldReduceMotion = useReducedMotion();

	if ( activeIndex < 0 || ! optionSizes || ! optionSizes[ activeIndex ] ) {
		return null;
	}

	const width = optionSizes[ activeIndex ];
	const x = inset + sumToNth( optionSizes, activeIndex );

	return (
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
	);
}
