type ItemSize = 'small' | 'medium' | 'large';

export interface ItemGroupProps {
	/**
	 * Renders a border around the itemgroup.
	 *
	 * @default false
	 */
	isBordered?: boolean;
	/**
	 * Renders with rounded corners.
	 *
	 * @default true
	 */
	isRounded?: boolean;
	/**
	 * Renders a separator between each item.
	 *
	 * @default false
	 */
	isSeparated?: boolean;
	/**
	 * Determines the amount of padding within the component.
	 *
	 * @default 'medium'
	 */
	size?: ItemSize;
	/**
	 * The children elements.
	 */
	children: React.ReactNode;
}

export interface ItemProps {
	/**
	 * Determines the amount of padding within the component.
	 *
	 * @default 'medium'
	 */
	size?: ItemSize;
	/**
	 * The children elements.
	 */
	children: React.ReactNode;
}

export type ItemGroupContext = {
	/**
	 * When true, each `Item` will be styled as an individual item (e.g. with rounded
	 * borders), instead of being part of the same UI block with the rest of the items.
	 *
	 * @default false
	 */
	spacedAround: boolean;
	/**
	 * Determines the amount of padding within the component.
	 *
	 * @default 'medium'
	 */
	size: ItemSize;
};
