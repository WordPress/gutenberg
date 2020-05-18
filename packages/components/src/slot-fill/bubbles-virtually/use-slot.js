/**
 * WordPress dependencies
 */
import { useCallback, useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SlotFillContext from './slot-fill-context';

export default function useSlot( name ) {
	const registry = useContext( SlotFillContext );

	const slot = registry.slots[ name ] || {};
	const slotFills = registry.fills[ name ];
	const fills = useMemo( () => slotFills || [], [ slotFills ] );

	const updateSlot = useCallback(
		( fillProps ) => {
			registry.updateSlot( name, fillProps );
		},
		[ name, registry.updateSlot ]
	);

	const unregisterSlot = useCallback(
		( slotRef ) => {
			registry.unregisterSlot( name, slotRef );
		},
		[ name, registry.unregisterSlot ]
	);

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
		...slot,
		updateSlot,
		unregisterSlot,
		fills,
		registerFill,
		unregisterFill,
	};
}
