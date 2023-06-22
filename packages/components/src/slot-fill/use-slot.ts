/**
 * External dependencies
 */
import type { Component } from 'react';

/**
 * WordPress dependencies
 */
import { useContext, useSyncExternalStore } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SlotFillContext from './context';
import type { SlotKey } from './types';

/**
 * React hook returning the active slot given a name.
 *
 * @param {string} name Slot name.
 * @return {Component|undefined} Slot object.
 */
const useSlot = ( name: SlotKey ) => {
	const { getSlot, subscribe } = useContext( SlotFillContext );
	return useSyncExternalStore< Component | undefined >(
		subscribe,
		() => getSlot( name ),
		() => getSlot( name )
	);
};

export default useSlot;
