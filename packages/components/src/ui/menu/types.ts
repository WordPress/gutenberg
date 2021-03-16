/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { MenuStateReturn } from 'reakit';
// eslint-disable-next-line no-restricted-imports
import type { MouseEvent, KeyboardEvent } from 'react';

/**
 * Internal dependencies
 */
import type { Props as BaseButtonProps } from '../base-button/types';

export type Props = {
	menu?: MenuStateReturn;
};

export type SelectEvent = MouseEvent | KeyboardEvent;

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
	/**
	 * Called when the menu item is clicked or when a keyDown event happens that is either Enter or Space.
	 */
	onSelect?: ( event: SelectEvent ) => void;
};
