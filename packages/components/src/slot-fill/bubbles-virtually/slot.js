/**
 * WordPress dependencies
 */
import { useRef, useLayoutEffect, useContext } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import SlotFillContext from './slot-fill-context';
import useSlot from './use-slot';

export default function Slot( {
	name,
	fillProps = {},
	as: Component = 'div',
	...props
} ) {
	const registry = useContext( SlotFillContext );
	const ref = useRef();
	const slot = useSlot( name );

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

	// fillProps may be an update that interact with the layout, so
	// we useLayoutEffect
	useLayoutEffect( () => {
		if ( slot.fillProps && ! isShallowEqual( slot.fillProps, fillProps ) ) {
			registry.updateSlot( name, ref, fillProps );
		}
	} );

	return <Component ref={ ref } { ...props } />;
}
