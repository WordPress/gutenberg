/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

const SlotFillContext = createContext( {
	__unstableDefaultContext: true,
	slots: {},
	fills: {},
	registerSlot: () => {},
	updateSlot: () => {},
	unregisterSlot: () => {},
	registerFill: () => {},
	unregisterFill: () => {},
} );

export default SlotFillContext;
