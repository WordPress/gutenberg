/**
 * WordPress dependencies
 */
import { observableMap } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { isShallowEqual } from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import SlotFillContext from './context';
import type {
	SlotRecord,
	FillRecord,
	SlotFillInstance,
	SlotFillRegistry,
	SlotFillProviderProps,
	SlotKey,
} from './types';

function createSlotRegistry(): SlotFillRegistry {
	const slots = observableMap< SlotKey, SlotRecord >();
	const fills = observableMap< SlotKey, FillRecord[] >();

	function registerSlot( name: SlotKey, slot: SlotRecord ) {
		slots.set( name, slot );
	}

	function unregisterSlot( name: SlotKey, instance: SlotFillInstance ) {
		// If a previous instance of a Slot by this name unmounts, do nothing,
		// as the slot and its fills should only be removed for the current
		// known instance.
		const currentSlot = slots.get( name );
		if ( ! currentSlot || currentSlot.instance !== instance ) {
			return;
		}

		slots.delete( name );
	}

	function updateSlot( name: SlotKey, slot: SlotRecord ) {
		if ( slot.type !== 'portal' ) {
			return;
		}

		const slotForName = slots.get( name );
		if ( ! slotForName ) {
			return;
		}

		if ( slotForName.type !== 'portal' ) {
			return;
		}

		if ( slotForName.instance !== slot.instance ) {
			return;
		}

		if ( isShallowEqual( slotForName.fillProps, slot.fillProps ) ) {
			return;
		}

		slots.set( name, slot );
	}

	function registerFill( name: SlotKey, fill: FillRecord ) {
		fills.set( name, [ ...( fills.get( name ) || [] ), fill ] );
	}

	function unregisterFill( name: SlotKey, instance: SlotFillInstance ) {
		const fillsForName = fills.get( name );
		if ( ! fillsForName ) {
			return;
		}

		fills.set(
			name,
			fillsForName.filter( ( fill ) => fill.instance !== instance )
		);
	}

	function updateFill( name: SlotKey, fill: FillRecord ) {
		const fillsForName = fills.get( name );
		if ( ! fillsForName ) {
			return;
		}

		const fillForInstance = fillsForName.find(
			( f ) => f.instance === fill.instance
		);
		if ( ! fillForInstance ) {
			return;
		}

		if ( fillForInstance.children === fill.children ) {
			return;
		}

		fills.set(
			name,
			fillsForName.map( ( f ) => {
				if ( f.instance === fill.instance ) {
					// Replace with the new fill record with updated `children`.
					return fill;
				}

				return f;
			} )
		);
	}

	return {
		slots,
		fills,
		registerSlot,
		unregisterSlot,
		updateSlot,
		registerFill,
		unregisterFill,
		updateFill,
	};
}

export function SlotFillProvider( { children }: SlotFillProviderProps ) {
	const [ contextValue ] = useState( createSlotRegistry );
	return (
		<SlotFillContext.Provider value={ contextValue }>
			{ children }
		</SlotFillContext.Provider>
	);
}

export default SlotFillProvider;
