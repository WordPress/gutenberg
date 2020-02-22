/**
 * WordPress dependencies
 */
import { useRef, useEffect, createPortal, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useSlot from './use-slot';

export default function Fill( { name, children } ) {
	const slot = useSlot( name );
	const ref = useRef();

	useEffect( () => {
		// We register fills so we can keep track of their existance.
		// Some Slot implementations need to know if there're already fills
		// registered so they can choose to render themselves or not.
		slot.registerFill( ref );
		return () => {
			slot.unregisterFill( ref );
		};
	}, [ slot.registerFill, slot.unregisterFill ] );

	if ( ! slot.ref || ! slot.ref.current ) {
		return null;
	}

	if ( typeof children === 'function' ) {
		children = children( slot.fillProps );
	}

	// We re-mount the portal children whenever the number of fills change
	// See https://github.com/WordPress/gutenberg/pull/19242#discussion_r381152030
	// We also check if the current fill has been already registered, because
	// the useEffect above will be called only after the first render, which
	// could trigger a re-mount here unnecessarily in the second render.
	const key =
		slot.fills.indexOf( ref ) !== -1
			? slot.fills.length
			: slot.fills.length + 1;

	return createPortal(
		<Fragment key={ key }>{ children }</Fragment>,
		slot.ref.current
	);
}
