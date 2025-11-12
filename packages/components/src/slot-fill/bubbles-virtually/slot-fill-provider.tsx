/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';
import { observableMap } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import SlotFillContext from './slot-fill-context';
import type {
	SlotFillProviderProps,
	SlotFillBubblesVirtuallyContext,
} from '../types';

function createSlotRegistry(): SlotFillBubblesVirtuallyContext {
	const slots: SlotFillBubblesVirtuallyContext[ 'slots' ] = observableMap();
	const fills: SlotFillBubblesVirtuallyContext[ 'fills' ] = observableMap();

	const registerSlot: SlotFillBubblesVirtuallyContext[ 'registerSlot' ] = (
		name,
		ref,
		fillProps
	) => {
		slots.set( name, { ref, fillProps } );
	};

	const unregisterSlot: SlotFillBubblesVirtuallyContext[ 'unregisterSlot' ] =
		( name, ref ) => {
			const slot = slots.get( name );
			if ( ! slot ) {
				return;
			}

			// Make sure we're not unregistering a slot registered by another element
			// See https://github.com/WordPress/gutenberg/pull/19242#issuecomment-590295412
			if ( slot.ref !== ref ) {
				return;
			}

			slots.delete( name );
		};

	const updateSlot: SlotFillBubblesVirtuallyContext[ 'updateSlot' ] = (
		name,
		ref,
		fillProps
	) => {
		const slot = slots.get( name );
		if ( ! slot ) {
			return;
		}

		if ( slot.ref !== ref ) {
			return;
		}

		if ( isShallowEqual( slot.fillProps, fillProps ) ) {
			return;
		}

		slots.set( name, { ref, fillProps } );
	};

	const registerFill: SlotFillBubblesVirtuallyContext[ 'registerFill' ] = (
		name,
		ref
	) => {
		fills.set( name, [ ...( fills.get( name ) || [] ), ref ] );
	};

	const unregisterFill: SlotFillBubblesVirtuallyContext[ 'unregisterFill' ] =
		( name, ref ) => {
			const fillsForName = fills.get( name );
			if ( ! fillsForName ) {
				return;
			}

			fills.set(
				name,
				fillsForName.filter( ( fillRef ) => fillRef !== ref )
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
