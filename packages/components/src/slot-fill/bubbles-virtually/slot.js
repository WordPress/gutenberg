// @ts-nocheck
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
	const { registerSlot, unregisterSlot, ...registry } =
		useContext( SlotFillContext );
	const ref = useRef();

	// We want don't fillProps in the deps of the layout effect below because we don't want to
	// unregister and register the slot whenever fillProps change. Doing so would
	// cause the fill to be re-mounted, and we are only considering the initial value
	// of fillProps. Instead, we store that initial value in a ref, but don't update it.
	const fillPropsRef = useRef( fillProps );

	useLayoutEffect( () => {
		registerSlot( name, ref, fillPropsRef.current );
		return () => {
			unregisterSlot( name, ref );
		};
	}, [ registerSlot, unregisterSlot, name ] );
	// fillProps may be an update that interacts with the layout, so we
	// useLayoutEffect.
	useLayoutEffect( () => {
		registry.updateSlot( name, fillProps );
	} );

	return (
		<Component ref={ useMergeRefs( [ forwardedRef, ref ] ) } { ...props } />
	);
}

export default forwardRef( Slot );
