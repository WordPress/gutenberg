/**
 * WordPress dependencies
 */
import { useCallback, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SlotFillContext from './slot-fill-context';

export default function useSlot( name ) {
	const registry = useContext( SlotFillContext );

	const { ref, fillProps } = registry.slots[ name ] || {};
	const fills = registry.fills[ name ] || [];

	const updateSlot = useCallback(
		( slotRef, slotFillProps ) => {
			registry.updateSlot( name, slotRef, slotFillProps );
		},
		[ name, registry.updateSlot ]
	);

	const unregisterSlot = useCallback( () => {
		registry.unregisterSlot( name );
	}, [ name, registry.unregisterSlot ] );

	const registerFill = useCallback(
		( fillRef ) => {
			registry.registerFill( name, fillRef );
		},
		[ name, registry.registerFill ]
	);

	const unregisterFill = useCallback(
		( fillRef ) => {
			registry.unregisterFill( name, fillRef );
		},
		[ name, registry.unregisterFill ]
	);

	return {
		ref,
		fillProps,
		updateSlot,
		unregisterSlot,
		fills,
		registerFill,
		unregisterFill,
	};
}
