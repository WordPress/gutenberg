import type { ElementType, MouseEventHandler, ReactNode } from 'react';

export type ActionItemFillProps = {
	/**
	 * The component the items render as. An item's own `as` overrides it.
	 */
	as?: ElementType;
	/**
	 * A handler run on every item, in addition to the item's own `onClick`.
	 */
	onClick?: MouseEventHandler< HTMLElement >;
};

export type ActionItemSlotProps = {
	/**
	 * The name of the slot and fill pair passed to the `Slot` component.
	 */
	name: string;
	/**
	 * The component used as the container of the fills.
	 *
	 * @default MenuGroup
	 */
	as?: ElementType;
	/**
	 * Defaults applied to every `ActionItem` in the slot. Only `as` and
	 * `onClick` are used.
	 */
	fillProps?: ActionItemFillProps;
	/**
	 * A function receiving the rendered fills as a flat array, for containers
	 * that wrap each fill. Takes precedence over `as`.
	 */
	children?: ( items: ReactNode[] ) => ReactNode;
	/**
	 * The props not referred above are passed to the container component.
	 */
	[ key: string ]: unknown;
};

export type ActionItemProps = {
	/**
	 * The name of the slot and fill pair passed to the `Fill` component.
	 */
	name: string;
	/**
	 * The component used to render the item. Defaults to the slot's
	 * `fillProps.as`, or to `MenuItem` to nest in the default `MenuGroup`.
	 *
	 * @default MenuItem
	 */
	as?: ElementType;
	/**
	 * Callback function executed when a click on the item happens. The slot's
	 * `fillProps.onClick` runs as well, if set.
	 */
	onClick?: MouseEventHandler< HTMLElement >;
	/**
	 * The props not referred above are passed to the item component.
	 */
	[ key: string ]: unknown;
};
