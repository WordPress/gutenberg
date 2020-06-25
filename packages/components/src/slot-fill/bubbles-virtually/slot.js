/**
 * WordPress dependencies
 */
import { useRef, useLayoutEffect, useContext } from '@wordpress/element';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import SlotFillContext from './slot-fill-context';

export default function Slot( {
	name,
	fillProps = {},
	as: Component = 'div',
	...props
} ) {
	const registry = useContext( SlotFillContext );
	const ref = useRef();

	if ( registry.__unstableDefaultContext ) {
		warning(
			'Components must be wrapped within `SlotFillProvider`. ' +
				'See https://developer.wordpress.org/block-editor/components/slot-fill/'
		);
	}

	useLayoutEffect( () => {
		registry.registerSlot( name, ref, fillProps );
		return () => {
			registry.unregisterSlot( name, ref );
		};
		// We are not including fillProps in the deps because we don't want to
		// unregister and register the slot whenever fillProps change, which would
		// cause the fill to be re-mounted. We are only considering the initial value
		// of fillProps.
	}, [ registry.registerSlot, registry.unregisterSlot, name ] );

	// fillProps may be an update that interacts with the layout, so we
	// useLayoutEffect
	useLayoutEffect( () => {
		registry.updateSlot( name, fillProps );
	} );

	return <Component ref={ ref } { ...props } />;
}
