/**
 * External dependencies
 */
import type { Component, MutableRefObject, ReactNode } from 'react';

export type SlotComponentProps = {
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

export type FillComponentProps = {
	/**
	 * Slot name.
	 */
	name: string;

	/**
	 * Children elements.
	 */
	children: ReactNode | ( ( fillProps: any ) => ReactNode );
};

export type SlotFillProviderProps = {
	/**
	 * The children elements.
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

export type BaseSlotFillContext = {
	registerSlot: (
		name: string,
		slot: Component< BaseSlotComponentProps >
	) => void;
	unregisterSlot: (
		name: string,
		slot: Component< BaseSlotComponentProps >
	) => void;
	registerFill: ( name: string, instance: FillComponentProps ) => void;
	unregisterFill: ( name: string, instance: FillComponentProps ) => void;
	getSlot: (
		name: string
	) => Component< BaseSlotComponentProps > | undefined;
	getFills: (
		name: string,
		slotInstance: Component< BaseSlotComponentProps >
	) => FillComponentProps[];
	subscribe: ( listener: () => void ) => () => void;
};

export type BaseSlotComponentProps = Pick<
	BaseSlotFillContext,
	'registerSlot' | 'unregisterSlot' | 'getFills'
> &
	Omit< SlotComponentProps, 'bubblesVirtually' >;
