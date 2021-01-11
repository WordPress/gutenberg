/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import createStore from './zustand';

/**
 * @template {Record<string | number | symbol, unknown>} TState
 * @param {import('./zustand/types').StateCreator<TState> | import('./zustand/types').StoreApi<TState>} createState
 */
export function useSubState( createState ) {
	return useRef( createStore( createState ) ).current;
}
