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
	// cause the fill to be re-mounted.
	useLayoutEffect( () => {
		registerSlot( name, ref, fillProps );
		return () => {
			unregisterSlot( name, ref );
		};
		// Ignore reason: see above.
		// Also, please see: https://github.com/WordPress/gutenberg/pull/44403#discussion_r994415973
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
