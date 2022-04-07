/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { useReducedMotion } from 'framer-motion';

/**
 * WordPress dependencies
 */
import { useLayoutEffect, useState, memo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ToggleGroupControlBackdropProps } from '../types';
import { useToggleGroupControlContext } from '../context';
import { CONFIG } from '../../utils';
import { AnimatedBackdrop } from './styles';

const TRANSITION_CONFIG = {
	type: 'spring',
	bounce: 0,
	// Transition durations in the config are expressed as a string in milliseconds,
	// while `framer-motion` needs them as integers in seconds.
	duration: parseInt( CONFIG.transitionDurationSlow, 10 ) / 1000,
};

function ToggleGroupControlBackdrop( {
	containerSizes,
}: ToggleGroupControlBackdropProps ) {
	const shouldReduceMotion = useReducedMotion();
	const { items, state, isBlock } = useToggleGroupControlContext();

	const [ itemSizes, setItemSizes ] = useState<
		| null
		| {
				width: number;
				left: number;
		  }[]
	>( null );

	const selectedItemIndex = items.findIndex(
		// All valid children (e.g. extending `ToggleGroupControlOptionBase`)
		// have a `data-value` attribute.
		( item ) =>
			typeof state !== 'undefined' &&
			item.ref.current?.dataset.value === `${ state }`
	);

	// `useLayoutEffect` is necessary because we need to wait for the DOM
	// mutations to take effect before reading the new element's sizes and offsets.
	useLayoutEffect( () => {
		setItemSizes(
			items.map( ( item ) => {
				// Using `offsetLeft` in order to get the gap with respect to the
				// `offsetParent` element. This is different from the behavior of other
				// functions (like `getBoundingClientRect`), which compute those figures
				// relatively to the viewport.
				// For this reason, it's important that the `offsetParent` of each `<Radio>`
				// option is the inner wrapper of `ToggleGroupControl` — which means that in
				// the DOM tree between that wrapper and each `<Radio>` component there
				// can't be any element with `position: relative` or `position: absolute`.
				// See https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetLeft

				const toggleGroupOptionWrapper = item.ref.current?.closest(
					'[data-toggle-group-control-option-wrapper="true"]'
				) as HTMLElement | null;

				return {
					left: toggleGroupOptionWrapper?.offsetLeft ?? -1,
					width: toggleGroupOptionWrapper?.offsetWidth ?? 0,
				};
			} )
		);
	}, [ containerSizes.width, containerSizes.height, items, isBlock ] );

	return selectedItemIndex >= 0 && itemSizes?.[ selectedItemIndex ] ? (
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
			animate={ {
				width: itemSizes[ selectedItemIndex ].width,
				x: `${ itemSizes[ selectedItemIndex ].left }px`,
			} }
		/>
	) : null;
}

export default memo( ToggleGroupControlBackdrop );
