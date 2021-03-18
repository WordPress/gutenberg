/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { MenuStateReturn } from 'reakit';

/**
 * Internal dependencies
 */
import type { Props as BaseButtonProps } from '../base-button/types';

export type Props = {
	/**
	 * Reakit menu state. Usually provided by the Dropdown component.
	 *
	 * When this is provided, the Reakit menu will be rendered with Reakit menu items.
	 * When it is not provided, a regular `div` with `button`s for menu items will be
	 * rendered.
	 *
	 * @default undefined
	 */
	menu?: MenuStateReturn;
};

export type MenuItemProps = BaseButtonProps & {
	/**
	 * Whether to close the menu when the item is clicked.
	 *
	 * @default false
	 */
	closeOnClick?: boolean;
	/**
	 * Renders a "back" arrow `Icon`, indicating a backwards navigation direction.
	 *
	 * @default false
	 */
	isBack?: boolean;
	/**
	 * Renders offset styles, used for negative margins within list-based component (e.g. `ListGroup`).
	 */
	isOffset?: boolean;
	/**
	 * Renders an opaque icon when the item is selected or a transparent one when the item is not selected.
	 */
	isSelected?: boolean;
	/**
	 * Renders a "forward" arrow `Icon`, indicating a forwards navigation direction.
	 *
	 * @default false
	 */
	showArrow?: boolean;
};
