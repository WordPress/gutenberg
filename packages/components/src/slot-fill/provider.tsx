/**
 * WordPress dependencies
 */
import type { Component } from '@wordpress/element';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SlotFillContext from './context';
import type {
	FillComponentProps,
	BaseSlotFillContext,
	BaseSlotComponentProps,
	SlotFillProviderProps,
} from './types';

export function createSlotRegistory(): BaseSlotFillContext {
	const slots: Record< string, Component< BaseSlotComponentProps > > = {};
	const fills: Record< string, FillComponentProps[] > = {};
	let listeners: Array< () => void > = [];

	function registerSlot(
		name: string,
		slot: Component< BaseSlotComponentProps >
	) {
		const previousSlot = slots[ name ];
		slots[ name ] = slot;
		triggerListeners();

		// Sometimes the fills are registered after the initial render of slot
		// But before the registerSlot call, we need to rerender the slot.
		forceUpdateSlot( name );

		// If a new instance of a slot is being mounted while another with the
		// same name exists, force its update _after_ the new slot has been
		// assigned into the instance, such that its own rendering of children
		// will be empty (the new Slot will subsume all fills for this name).
		if ( previousSlot ) {
			previousSlot.forceUpdate();
		}
	}

	function registerFill( name: string, instance: FillComponentProps ) {
		fills[ name ] = [ ...( fills[ name ] || [] ), instance ];
		forceUpdateSlot( name );
	}

	function unregisterSlot(
		name: string,
		instance: Component< BaseSlotComponentProps >
	) {
		// If a previous instance of a Slot by this name unmounts, do nothing,
		// as the slot and its fills should only be removed for the current
		// known instance.
		if ( slots[ name ] !== instance ) {
			return;
		}

		delete slots[ name ];
		triggerListeners();
	}

	function unregisterFill( name: string, instance: FillComponentProps ) {
		fills[ name ] =
			fills[ name ]?.filter( ( fill ) => fill !== instance ) ?? [];
		forceUpdateSlot( name );
	}

	function getSlot(
		name: string
	): Component< BaseSlotComponentProps > | undefined {
		return slots[ name ];
	}

	function getFills(
		name: string,
		slotInstance: Component< BaseSlotComponentProps >
	): FillComponentProps[] {
		// Fills should only be returned for the current instance of the slot
		// in which they occupy.
		if ( slots[ name ] !== slotInstance ) {
			return [];
		}
		return fills[ name ];
	}

	function forceUpdateSlot( name: string ) {
		const slot = getSlot( name );

		if ( slot ) {
			slot.forceUpdate();
		}
	}

	function triggerListeners() {
		listeners.forEach( ( listener ) => listener() );
	}

	function subscribe( listener: () => void ) {
		listeners.push( listener );

		return () => {
			listeners = listeners.filter( ( l ) => l !== listener );
		};
	}

	return {
		registerSlot,
		unregisterSlot,
		registerFill,
		unregisterFill,
		getSlot,
		getFills,
		subscribe,
	};
}

export function SlotFillProvider( { children }: SlotFillProviderProps ) {
	const [ contextValue ] = useState( createSlotRegistory );
	return (
		<SlotFillContext.Provider value={ contextValue }>
			{ children }
		</SlotFillContext.Provider>
	);
}

export default SlotFillProvider;
