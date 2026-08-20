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
	 * A CSS class to add to the wrapper element that `Item` renders around its
	 * contents. It is added alongside the wrapper's own class rather than
	 * replacing it.
	 */
	wrapperClassName?: string;
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
