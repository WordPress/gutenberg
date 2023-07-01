/**
 * External dependencies
 */
import type { Component, MutableRefObject, ReactNode } from 'react';

export type SlotKey = string | symbol;

type SlotPropBase = {
	/**
	 * Slot name.
	 */
	name: SlotKey;
	/**
	 * props to pass from `Slot` to `Fill`.
	 *
	 * @default {}
	 */
	fillProps?: any;

	/**
	 * By default, events will bubble to their parents on the DOM hierarchy (native event bubbling).
	 * If set to true, events will bubble to their virtual parent in the React elements hierarchy instead,
	 * also accept an optional `className`, `id`, etc.  to add to the slot container.
	 */
	bubblesVirtually?: boolean;
};

export type SlotComponentProps =
	| ( SlotPropBase & {
			bubblesVirtually: true;
	  } )
	| ( SlotPropBase & {
			bubblesVirtually?: false;

			/**
			 * A function that returns nodes to be rendered.
			 * Not supported when `bubblesVirtually` is true.
			 */
			children?: ( fills: ReactNode ) => ReactNode;
	  } );

export type FillComponentProps = {
	/**
	 * The name of the slot to fill into.
	 */
	name: SlotKey;

	/**
	 * Children elements or.
	 */
	children?: ReactNode | ( ( fillProps: any ) => ReactNode );
};

export type SlotFillProviderProps = {
	/**
	 * The children elements.
	 */
	children: ReactNode;
};

export type BubblesVirtuallySlotFillContext = {
	slots: Map<
		SlotKey,
		{
			ref: MutableRefObject< HTMLElement | undefined >;
			fillProps: any;
		}
	>;
	fills: Map< SlotKey, MutableRefObject< { rerender: () => void } >[] >;
	registerSlot: (
		name: SlotKey,
		ref: MutableRefObject< HTMLElement | undefined >,
		fillProps: any
	) => void;
	unregisterSlot: (
		name: SlotKey,
		ref: MutableRefObject< HTMLElement | undefined >
	) => void;
	updateSlot: ( name: SlotKey, fillProps: any ) => void;
	registerFill: (
		name: SlotKey,
		ref: MutableRefObject< { rerender: () => void } >
	) => void;
	unregisterFill: (
		name: SlotKey,
		ref: MutableRefObject< { rerender: () => void } >
	) => void;
};

export type BaseSlotFillContext = {
	registerSlot: (
		name: SlotKey,
		slot: Component< BaseSlotComponentProps >
	) => void;
	unregisterSlot: (
		name: SlotKey,
		slot: Component< BaseSlotComponentProps >
	) => void;
	registerFill: ( name: SlotKey, instance: FillComponentProps ) => void;
	unregisterFill: ( name: SlotKey, instance: FillComponentProps ) => void;
	getSlot: (
		name: SlotKey
	) => Component< BaseSlotComponentProps > | undefined;
	getFills: (
		name: SlotKey,
		slotInstance: Component< BaseSlotComponentProps >
	) => FillComponentProps[];
	subscribe: ( listener: () => void ) => () => void;
};

export type BaseSlotComponentProps = Pick<
	BaseSlotFillContext,
	'registerSlot' | 'unregisterSlot' | 'getFills'
> &
	Omit< SlotComponentProps, 'bubblesVirtually' > & {
		children?: ( fills: ReactNode ) => ReactNode;
	};
