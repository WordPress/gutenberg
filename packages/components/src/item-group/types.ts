type ItemSize = 'small' | 'medium' | 'large';

export interface ItemGroupProps {
	/**
	 * Renders borders around each items.
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
	 * Renders items individually. Even if `isBordered` is `false`, a border
	 * in between each item will be still be displayed.
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
	 * Renders the item as an interactive `button` element.
	 *
	 * @default false
	 */
	isAction?: boolean;
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
