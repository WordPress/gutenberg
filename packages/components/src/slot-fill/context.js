// @ts-nocheck
/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

export const SlotFillContext = createContext( {
	registerSlot: () => {},
	unregisterSlot: () => {},
	registerFill: () => {},
	unregisterFill: () => {},
	getSlot: () => {},
	getFills: () => {},
	subscribe: () => {},
} );

export default SlotFillContext;
