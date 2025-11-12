/**
 * WordPress dependencies
 */
import { observableMap } from '@wordpress/compose';
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { BaseSlotFillContext } from './types';

const initialValue: BaseSlotFillContext = {
	slots: observableMap(),
	fills: observableMap(),
	registerSlot: () => {},
	unregisterSlot: () => {},
	registerFill: () => {},
	unregisterFill: () => {},
	updateFill: () => {},
};
export const SlotFillContext = createContext( initialValue );
SlotFillContext.displayName = 'SlotFillContext';

export default SlotFillContext;
