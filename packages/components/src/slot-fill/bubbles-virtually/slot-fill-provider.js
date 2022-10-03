// @ts-nocheck
/**
 * External dependencies
 */
import { ref as valRef } from 'valtio';
import { proxyMap } from 'valtio/utils';

/**
 * WordPress dependencies
 */
import { useMemo, useCallback } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import SlotFillContext from './slot-fill-context';

function useSlotRegistry() {
	const slots = proxyMap();
	const fills = proxyMap();

	const registerSlot = useCallback( ( name, ref, fillProps ) => {
		const slot = slots.get( name ) || {};
		slots.set(
			name,
			valRef( {
				...slot,
				ref: ref || slot.ref,
				fillProps: fillProps || slot.fillProps || {},
			} )
		);
	}, [] );

	const unregisterSlot = useCallback( ( name, ref ) => {
		// Make sure we're not unregistering a slot registered by another element
		// See https://github.com/WordPress/gutenberg/pull/19242#issuecomment-590295412
		if ( slots.get( name )?.ref === ref ) {
			slots.delete( name );
		}
	}, [] );

	const updateSlot = useCallback( ( name, fillProps ) => {
		const slot = slots.get( name );
		if ( ! slot ) {
			return;
		}

		if ( ! isShallowEqual( slot.fillProps, fillProps ) ) {
			slot.fillProps = fillProps;
			const slotFills = fills.get( name );
			if ( slotFills ) {
				// Force update fills.
				slotFills.map( ( fill ) => fill.current.rerender() );
			}
		}
	}, [] );

	const registerFill = useCallback( ( name, ref ) => {
		fills.set( name, valRef( [ ...( fills.get( name ) || [] ), ref ] ) );
	}, [] );

	const unregisterFill = useCallback( ( name, ref ) => {
		if ( fills.get( name ) ) {
			fills.set(
				name,
				fills.get( name ).filter( ( fillRef ) => fillRef !== ref )
			);
		}
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
