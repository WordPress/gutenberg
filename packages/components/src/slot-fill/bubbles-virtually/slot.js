/**
 * WordPress dependencies
 */
import {
	useRef,
	useLayoutEffect,
	useContext,
	forwardRef,
} from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import SlotFillContext from './slot-fill-context';

function Slot(
	{ name, fillProps = {}, as: Component = 'div', ...props },
	forwardedRef
) {
	const registry = useContext( SlotFillContext );
	const ref = useRef();

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

	return (
		<Component ref={ useMergeRefs( [ forwardedRef, ref ] ) } { ...props } />
	);
}

export default forwardRef( Slot );
