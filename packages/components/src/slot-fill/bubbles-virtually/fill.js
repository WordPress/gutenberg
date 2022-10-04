// @ts-nocheck
/**
 * WordPress dependencies
 */
import { useRef, useState, useEffect, createPortal } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useSlot from './use-slot';
import StyleProvider from '../../style-provider';

function useForceUpdate() {
	const [ , setState ] = useState( {} );
	const mounted = useRef( true );

	useEffect( () => {
		return () => {
			mounted.current = false;
		};
	}, [] );

	return () => {
		if ( mounted.current ) {
			setState( {} );
		}
	};
}

export default function Fill( { name, children } ) {
	const slot = useSlot( name );
	const ref = useRef( { rerender: useForceUpdate() } );

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

	// When using a `Fill`, the `children` will be rendered in the document of the
	// `Slot`. This means that we need to wrap the `children` in a `StyleProvider`
	// to make sure we're referencing the right document/iframe (instead of the
	// context of the `Fill`'s parent).
	const wrappedChildren = (
		<StyleProvider document={ slot.ref.current.ownerDocument }>
			{ children }
		</StyleProvider>
	);

	return createPortal( wrappedChildren, slot.ref.current );
}
