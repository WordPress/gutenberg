/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';
/**
 * Internal dependencies
 */
import type { BaseSlotFillContext } from './types';

const initialValue: BaseSlotFillContext = {
	registerSlot: () => {},
	unregisterSlot: () => {},
	registerFill: () => {},
	unregisterFill: () => {},
	getSlot: () => undefined,
	getFills: () => [],
	subscribe: () => () => {},
};
export const SlotFillContext = createContext( initialValue );

export default SlotFillContext;
