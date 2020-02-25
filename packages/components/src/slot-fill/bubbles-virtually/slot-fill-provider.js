/**
 * WordPress dependencies
 */
import { useMemo, useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SlotFillContext from './slot-fill-context';

function useSlotRegistry() {
	const [ slots, setSlots ] = useState( {} );
	const [ fills, setFills ] = useState( {} );

	const registerSlot = useCallback( ( name, ref, fillProps ) => {
		setSlots( ( prevSlots ) => ( {
			...prevSlots,
			[ name ]: {
				...prevSlots[ name ],
				ref: ref || prevSlots[ name ].ref,
				fillProps: fillProps || prevSlots[ name ].fillProps || {},
			},
		} ) );
	}, [] );

	const unregisterSlot = useCallback( ( name, ref ) => {
		setSlots( ( prevSlots ) => {
			// eslint-disable-next-line no-unused-vars
			const { [ name ]: slot, ...nextSlots } = prevSlots;
			// Make sure we're not unregistering a slot registered by another element
			// See https://github.com/WordPress/gutenberg/pull/19242#issuecomment-590295412
			if ( slot.ref === ref ) {
				return nextSlots;
			}
			return prevSlots;
		} );
	}, [] );

	const registerFill = useCallback( ( name, ref ) => {
		setFills( ( prevFills ) => ( {
			...prevFills,
			[ name ]: [ ...( prevFills[ name ] || [] ), ref ],
		} ) );
	}, [] );

	const unregisterFill = useCallback( ( name, ref ) => {
		setFills( ( prevFills ) => {
			if ( prevFills[ name ] ) {
				return {
					...prevFills,
					[ name ]: prevFills[ name ].filter(
						( fillRef ) => fillRef !== ref
					),
				};
			}
			return prevFills;
		} );
	}, [] );

	// Memoizing the return value so it can be directly passed to Provider value
	const registry = useMemo(
		() => ( {
			slots,
			fills,
			registerSlot,
			// Just for readability
			updateSlot: registerSlot,
			unregisterSlot,
			registerFill,
			unregisterFill,
		} ),
		[
			slots,
			fills,
			registerSlot,
			unregisterSlot,
			registerFill,
			unregisterFill,
		]
	);

	return registry;
}

export default function SlotFillProvider( { children } ) {
	const registry = useSlotRegistry();
	return (
		<SlotFillContext.Provider value={ registry }>
			{ children }
		</SlotFillContext.Provider>
	);
}
