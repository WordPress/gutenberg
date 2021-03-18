/**
 * Internal dependencies
 */
import type { Props as BaseButtonProps } from '../base-button/types';

export type Props = {};

export type MenuItemProps = BaseButtonProps & {
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
