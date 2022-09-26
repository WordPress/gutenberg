// @ts-nocheck
/**
 * WordPress dependencies
 */
import { useMemo, useCallback, useState } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import SlotFillContext from './slot-fill-context';

function useSlotRegistry() {
	const [ slots, setSlots ] = useState( {} );
	const [ fills, setFills ] = useState( {} );

	const registerSlot = useCallback( ( name, ref, fillProps ) => {
		setSlots( ( prevSlots ) => {
			const slot = prevSlots[ name ] || {};
			return {
				...prevSlots,
				[ name ]: {
					...slot,
					ref: ref || slot.ref,
					fillProps: fillProps || slot.fillProps || {},
				},
			};
		} );
	}, [] );

	const unregisterSlot = useCallback( ( name, ref ) => {
		setSlots( ( prevSlots ) => {
			const { [ name ]: slot, ...nextSlots } = prevSlots;
			// Make sure we're not unregistering a slot registered by another element
			// See https://github.com/WordPress/gutenberg/pull/19242#issuecomment-590295412
			if ( slot?.ref === ref ) {
				return nextSlots;
			}
			return prevSlots;
		} );
	}, [] );

	const updateSlot = useCallback(
		( name, fillProps ) => {
			const slot = slots[ name ];
			if ( ! slot ) {
				return;
			}
			if ( ! isShallowEqual( slot.fillProps, fillProps ) ) {
				slot.fillProps = fillProps;
				const slotFills = fills[ name ];
				if ( slotFills ) {
					// Force update fills.
					slotFills.map( ( fill ) => fill.current.rerender() );
				}
			}
		},
		[ slots, fills ]
	);

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
			updateSlot,
			unregisterSlot,
			registerFill,
			unregisterFill,
		} ),
		[
			slots,
			fills,
			registerSlot,
			updateSlot,
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
