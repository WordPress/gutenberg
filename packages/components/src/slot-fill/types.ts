/**
 * External dependencies
 */
import type { ReactNode, RefObject } from 'react';

/**
 * WordPress dependencies
 */
import type { ObservableMap } from '@wordpress/compose';

export type DistributiveOmit< T, K extends keyof any > = T extends any
	? Omit< T, K >
	: never;

export type SlotKey = string | symbol;

export type FillProps = Record< string, any >;

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
	fillProps?: FillProps;
};

export type SlotComponentProps =
	| ( SlotPropBase & {
			/**
			 * By default, events will bubble to their parents on the DOM hierarchy (native event bubbling).
			 * If set to true, events will bubble to their virtual parent in the React elements hierarchy instead,
			 * also accept an optional `className`, `id`, etc.  to add to the slot container.
			 */
			bubblesVirtually: true;

			/**
			 * A function that returns nodes to be rendered.
			 * Supported only when `bubblesVirtually` is `false`.
			 */
			children?: never;

			/**
			 * Additional className for the `Slot` component.
			 * Supported only when `bubblesVirtually` is `true`.
			 */
			className?: string;

			/**
			 * Additional styles for the `Slot` component.
			 * Supported only when `bubblesVirtually` is `true`.
			 */
			style?: React.CSSProperties;
	  } )
	| ( SlotPropBase & {
			/**
			 * By default, events will bubble to their parents on the DOM hierarchy (native event bubbling).
			 * If set to true, events will bubble to their virtual parent in the React elements hierarchy instead,
			 * also accept an optional `className`, `id`, etc.  to add to the slot container.
			 */
			bubblesVirtually?: false;

			/**
			 * A function that returns nodes to be rendered.
			 * Supported only when `bubblesVirtually` is `false`.
			 */
			children?: ( fills: ReactNode ) => ReactNode;

			/**
			 * Additional className for the `Slot` component.
			 * Supported only when `bubblesVirtually` is `true`.
			 */
			className?: never;

			/**
			 * Additional styles for the `Slot` component.
			 * Supported only when `bubblesVirtually` is `true`.
			 */
			style?: never;
	  } );

export type FillChildren =
	| ReactNode
	| ( ( fillProps: FillProps ) => ReactNode );

export type FillComponentProps = {
	/**
	 * The name of the slot to fill into.
	 */
	name: SlotKey;

	/**
	 * Children elements or render function.
	 */
	children?: FillChildren;
};

export type SlotFillProviderProps = {
	/**
	 * The children elements.
	 */
	children: ReactNode;

	/**
	 * Whether to pass slots to the parent provider if existent.
	 */
	passthrough?: boolean;
};

export type SlotRef = RefObject< HTMLElement >;
export type FillInstance = {};
export type BaseSlotInstance = {};

export type SlotFillBubblesVirtuallyContext = {
	slots: ObservableMap< SlotKey, { ref: SlotRef; fillProps: FillProps } >;
	fills: ObservableMap< SlotKey, FillInstance[] >;
	registerSlot: ( name: SlotKey, ref: SlotRef, fillProps: FillProps ) => void;
	unregisterSlot: ( name: SlotKey, ref: SlotRef ) => void;
	updateSlot: ( name: SlotKey, ref: SlotRef, fillProps: FillProps ) => void;
	registerFill: ( name: SlotKey, instance: FillInstance ) => void;
	unregisterFill: ( name: SlotKey, instance: FillInstance ) => void;

	/**
	 * This helps the provider know if it's using the default context value or not.
	 */
	isDefault?: boolean;
};

export type BaseSlotFillContext = {
	slots: ObservableMap< SlotKey, BaseSlotInstance >;
	fills: ObservableMap<
		SlotKey,
		{ instance: FillInstance; children: FillChildren }[]
	>;
	registerSlot: ( name: SlotKey, slot: BaseSlotInstance ) => void;
	unregisterSlot: ( name: SlotKey, slot: BaseSlotInstance ) => void;
	registerFill: (
		name: SlotKey,
		instance: FillInstance,
		children: FillChildren
	) => void;
	unregisterFill: ( name: SlotKey, instance: FillInstance ) => void;
	updateFill: (
		name: SlotKey,
		instance: FillInstance,
		children: FillChildren
	) => void;
};
