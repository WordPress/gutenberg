/**
 * External dependencies
 */
import { ref as valRef } from 'valtio';
import { proxyMap } from 'valtio/utils';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import SlotFillContext from './slot-fill-context';
import type {
	SlotFillProviderProps,
	BubblesVirtuallySlotFillContext,
} from '../types';

function createSlotRegistry(): BubblesVirtuallySlotFillContext {
	const slots: BubblesVirtuallySlotFillContext[ 'slots' ] = proxyMap();
	const fills: BubblesVirtuallySlotFillContext[ 'fills' ] = proxyMap();

	const registerSlot: BubblesVirtuallySlotFillContext[ 'registerSlot' ] = (
		name,
		ref,
		fillProps
	) => {
		const slot = ( slots.get( name ) || {} ) as {
			ref: typeof ref;
			fillProps: typeof fillProps;
		};

		slots.set(
			name,
			valRef( {
				...slot,
				ref: ref || slot.ref,
				fillProps: fillProps || slot.fillProps || {},
			} )
		);
	};

	const unregisterSlot: BubblesVirtuallySlotFillContext[ 'unregisterSlot' ] =
		( name, ref ) => {
			// Make sure we're not unregistering a slot registered by another element
			// See https://github.com/WordPress/gutenberg/pull/19242#issuecomment-590295412
			if ( slots.get( name )?.ref === ref ) {
				slots.delete( name );
			}
		};

	const updateSlot: BubblesVirtuallySlotFillContext[ 'updateSlot' ] = (
		name,
		fillProps
	) => {
		const slot = slots.get( name );
		if ( ! slot ) {
			return;
		}

		if ( isShallowEqual( slot.fillProps, fillProps ) ) {
			return;
		}

		slot.fillProps = fillProps;
		const slotFills = fills.get( name );
		if ( slotFills ) {
			// Force update fills.
			slotFills.map( ( fill ) => fill.current.rerender() );
		}
	};

	const registerFill: BubblesVirtuallySlotFillContext[ 'registerFill' ] = (
		name,
		ref
	) => {
		fills.set( name, valRef( [ ...( fills.get( name ) || [] ), ref ] ) );
	};

	const unregisterFill: BubblesVirtuallySlotFillContext[ 'registerFill' ] = (
		name,
		ref
	) => {
		const fillsForName = fills.get( name );
		if ( ! fillsForName ) {
			return;
		}

		fills.set(
			name,
			valRef( fillsForName.filter( ( fillRef ) => fillRef !== ref ) )
		);
	};

	return {
		slots,
		fills,
		registerSlot,
		updateSlot,
		unregisterSlot,
		registerFill,
		unregisterFill,
	};
}

export default function SlotFillProvider( {
	children,
}: SlotFillProviderProps ) {
	const [ registry ] = useState( createSlotRegistry );
	return (
		<SlotFillContext.Provider value={ registry }>
			{ children }
		</SlotFillContext.Provider>
	);
}
