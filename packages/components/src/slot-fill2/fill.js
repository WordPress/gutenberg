/**
 * WordPress dependencies
 */
import { createPortal } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSlot } from './context';

export default function Fill( { name, children } ) {
	const slot = useSlot( name );

	if ( ! slot ) {
		return null;
	}

	if ( typeof children === 'function' ) {
		children = children( slot.fillProps );
	}

	return createPortal( children, slot.ref.current );
}
