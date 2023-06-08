/**
 * External dependencies
 */
import type { MutableRefObject, ReactNode } from 'react';

export type BubblesVirtuallySlotProps = {
	/**
	 * Slot name.
	 */
	name: string;
	/**
	 * props to pass from `Slot` to `Fill`.
	 *
	 * @default {}
	 */
	fillProps?: any;
};

export type BubblesVirtuallyFillProps = {
	/**
	 * Slot name.
	 */
	name: string;

	/**
	 * Children elements.
	 */
	children: ReactNode;
};

export type BubblesVirtuallySlotFillContext = {
	slots: Map<
		string,
		{
			ref: MutableRefObject< HTMLElement | undefined >;
			fillProps: any;
		}
	>;
	fills: Map< string, MutableRefObject< { rerender: () => {} } >[] >;
	registerSlot: (
		name: string,
		ref: MutableRefObject< HTMLElement | undefined >,
		fillProps: any
	) => void;
	unregisterSlot: (
		name: string,
		ref: MutableRefObject< HTMLElement | undefined >
	) => void;
	updateSlot: ( name: string, fillProps: any ) => void;
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
