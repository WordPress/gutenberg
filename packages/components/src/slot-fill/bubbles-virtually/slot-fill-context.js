/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

const SlotFillContext = createContext( {
	slots: {},
	fills: {},
	registerSlot: () => {},
	updateSlot: () => {},
	unregisterSlot: () => {},
	registerFill: () => {},
	unregisterFill: () => {},
} );

export default SlotFillContext;
