/**
 * External dependencies
 */
import type { MutableRefObject, ReactNode } from 'react';

export type BubblesVirtuallySlotProps = {
	name: string;
	fillProps: any;
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
