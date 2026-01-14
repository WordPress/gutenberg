/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SlotFillContext from './context';
import type {
	FillInstance,
	FillChildren,
	BaseSlotInstance,
	BaseSlotFillContext,
	SlotFillProviderProps,
	SlotKey,
} from './types';
import { observableMap } from '@wordpress/compose';

function createSlotRegistry(): BaseSlotFillContext {
	const slots = observableMap< SlotKey, BaseSlotInstance >();
	const fills = observableMap<
		SlotKey,
		{ instance: FillInstance; children: FillChildren }[]
	>();

	function registerSlot( name: SlotKey, instance: BaseSlotInstance ) {
		slots.set( name, instance );
	}

	function unregisterSlot( name: SlotKey, instance: BaseSlotInstance ) {
		// If a previous instance of a Slot by this name unmounts, do nothing,
		// as the slot and its fills should only be removed for the current
		// known instance.
		if ( slots.get( name ) !== instance ) {
			return;
		}

		slots.delete( name );
	}

	function registerFill(
		name: SlotKey,
		instance: FillInstance,
		children: FillChildren
	) {
		fills.set( name, [
			...( fills.get( name ) || [] ),
			{ instance, children },
		] );
	}

	function unregisterFill( name: SlotKey, instance: FillInstance ) {
		const fillsForName = fills.get( name );
		if ( ! fillsForName ) {
			return;
		}

		fills.set(
			name,
			fillsForName.filter( ( fill ) => fill.instance !== instance )
		);
	}

	function updateFill(
		name: SlotKey,
		instance: FillInstance,
		children: FillChildren
	) {
		const fillsForName = fills.get( name );
		if ( ! fillsForName ) {
			return;
		}

		const fillForInstance = fillsForName.find(
			( f ) => f.instance === instance
		);
		if ( ! fillForInstance ) {
			return;
		}

		if ( fillForInstance.children === children ) {
			return;
		}

		fills.set(
			name,
			fillsForName.map( ( f ) => {
				if ( f.instance === instance ) {
					// Replace with new record with updated `children`.
					return { instance, children };
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
