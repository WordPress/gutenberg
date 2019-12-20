/**
 * WordPress dependencies
 */
import { useEffect, useRef, useLayoutEffect, useContext } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import { SlotFillContext, useSlot } from './context';

export default function Slot( {
	name,
	fillProps = {},
	as: Component = 'div',
	...props
} ) {
	const registry = useContext( SlotFillContext );
	const ref = useRef();
	const slot = useSlot( name );

	useEffect( () => {
		registry.register( name, ref, fillProps );
		return () => {
			registry.unregister( name );
		};
	// We are not including fillProps in the deps because we don't want to
	// unregister and register the slot whenever fillProps change, which would
	// cause the fill to be re-mounted. We are only considering the initial value
	// of fillProps.
	}, [ registry.register, registry.unregister, name ] );

	// fillProps may be an update that interact with the layout, so
	// we useLayoutEffect
	useLayoutEffect( () => {
		if ( slot && ! isShallowEqual( slot.fillProps, fillProps ) ) {
			registry.update( name, ref, fillProps );
		}
	} );

	return <Component ref={ ref } { ...props } />;
}
