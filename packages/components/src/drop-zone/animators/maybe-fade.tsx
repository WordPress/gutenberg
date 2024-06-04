/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { useReducedMotion } from '@wordpress/compose';

/**
 * Handles fade-in/fade-out animation for its children if `reducedMotion` is disabled,
 * if not, just shows/hides the children without any animation.
 *
 * Relies on the animations being defined in CSS styles.
 */
export const MaybeFade: React.FC< {
	show: boolean;
	children: ReactNode;
	duration?: number;
} > = ( { show, children } ) => {
	const [ shouldRender, setRender ] = useState( show );
	const reducedMotion = useReducedMotion();

	useEffect( () => {
		if ( show ) {
			setRender( true );
		} else if ( reducedMotion ) {
			setRender( false );
		}
	}, [ show, reducedMotion ] );

	const props = ! reducedMotion
		? {
				className: show
					? 'components-drop-zone__fade-enter'
					: 'components-drop-zone__fade-exit',
				onAnimationEnd: () => {
					if ( ! show ) {
						setRender( false );
					}
				},
		  }
		: {};

	return shouldRender && <div { ...props }>{ children }</div>;
};
