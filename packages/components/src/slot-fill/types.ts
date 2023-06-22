/**
 * External dependencies
 */
import type { Component, MutableRefObject, ReactNode } from 'react';

export type SlotProps = {
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

	/**
	 * A function that returns nodes to be rendered.
	 *
	 * @param fills
	 */
	children?: ( fills: ReactNode[] ) => ReactNode;

	/**
	 * If true, events will bubble to their parents on the DOM hierarchy (native event bubbling).
	 */
	bubblesVirtually?: boolean;
};

export type BubblesVirtuallyFillProps = {
	/**
	 * Slot name.
	 */
	name: string;

	/**
	 * Children elements.
	 */
	children: ReactNode | ( ( fillProps: any ) => ReactNode );
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

export type SlotFillProviderProps = {
	/**
	 * The children elements.
	 */
	children: ReactNode;
};

export type BaseSlotFillContext = {
	registerSlot: (
		name: string,
		slot: Component< SlotComponentProps >
	) => void;
	unregisterSlot: (
		name: string,
		slot: Component< SlotComponentProps >
	) => void;
	registerFill: ( name: string, instance: BaseFillObject ) => void;
	unregisterFill: ( name: string, instance: BaseFillObject ) => void;
	getSlot: ( name: string ) => Component< SlotComponentProps > | undefined;
	getFills: (
		name: string,
		slotInstance: Component< SlotComponentProps >
	) => BaseFillObject[];
	subscribe: ( listener: () => void ) => () => void;
};

export type BaseSlotProps = {
	name: string;
	fillProps?: any;
	children?: ( fills: ReactNode[] ) => ReactNode;
};

export type SlotComponentProps = {
	registerSlot: (
		name: string,
		slot: Component< SlotComponentProps >
	) => void;
	unregisterSlot: (
		name: string,
		slot: Component< SlotComponentProps >
	) => void;
	getFills: (
		name: string,
		slotInstance: Component< SlotComponentProps >
	) => BaseFillObject[];
} & BaseSlotProps;

export type BaseFillObject = {
	name: string;
	children: ReactNode | ( ( fillProps: any ) => ReactNode );
};

export type FillComponentProps = {
	name: string;
	children: ReactNode | ( ( fillProps: any ) => ReactNode );
};
