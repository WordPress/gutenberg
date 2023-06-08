/**
 * External dependencies
 */
import type { MutableRefObject, ReactNode } from 'react';

export type FillProps = {
	/**
	 * Slot name.
	 */
	name: string;

	/**
	 * The children to stack.
	 */
	children: ReactNode;
};

export type SlotRegistry = {
	slots: Map<
		string,
		{
			ref: MutableRefObject< HTMLElement >;
			fillProps: FillProps;
		}
	>;
	fills: Map< string, MutableRefObject< { rerender: () => {} } >[] >;
	registerSlot: (
		name: string,
		ref: MutableRefObject< HTMLElement >,
		fillProps: FillProps
	) => void;
	unregisterSlot: (
		name: string,
		ref: MutableRefObject< HTMLElement >
	) => void;
	updateSlot: ( name: string, fillProps: FillProps ) => void;
	registerFill: (
		name: string,
		ref: MutableRefObject< { rerender: () => {} } >
	) => void;
	unregisterFill: (
		name: string,
		ref: MutableRefObject< { rerender: () => {} } >
	) => void;
};

export type BubblesVirtuallySlotFillProviderProps = {
	/**
	 * The children elements.
	 */
	children: ReactNode;
};
