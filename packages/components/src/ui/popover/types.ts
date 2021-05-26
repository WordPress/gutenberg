/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { PopoverStateReturn } from 'reakit';
// eslint-disable-next-line no-restricted-imports
import type { CSSProperties, FunctionComponentElement } from 'react';

/**
 * Internal dependencies
 */
import type { PopperProps } from '../utils/types';

export type PopoverContext = {
	popover?: PopoverStateReturn;
	label?: string;
};

export type Props = PopperProps & {
	state?: PopoverStateReturn;
	label?: string;
	/**
	 * Determines if `Popover` has animations.
	 */
	animated?: boolean;
	/**
	 * The duration of `Popover` animations.
	 *
	 * @default 160
	 */
	animationDuration?: boolean;
	/**
	 * ID that will serve as a base for all the items IDs.
	 *
	 * @see https://reakit.io/docs/popover/#usepopoverstate
	 */
	baseId?: string;
	/**
	 * Renders `Elevation` styles for the `Popover`.
	 *
	 * @default 5
	 */
	elevation?: number;
	/**
	 * Max-width for the `Popover` element.
	 */
	maxWidth?: CSSProperties[ 'maxWidth' ];
	/**
	 * Callback for when the `visible` state changes.
	 */
	onVisibleChange?: ( ...args: any ) => void;
	/**
	 * Element that triggers the `visible` state of `Popover` when clicked.
	 *
	 * @example
	 * ```jsx
	 * <Popover trigger={<Button>Greet</Button>}>
	 *  <Text>Hi! I'm Olaf!</Text>
	 * </Popover>
	 * ```
	 */
	trigger: FunctionComponentElement< any >;
	/**
	 * Whether `Popover` is visible.
	 *
	 * @default false
	 *
	 * @see https://reakit.io/docs/popover/#usepopoverstate
	 */
	visible?: boolean;
	/**
	 * The children elements.
	 */
	children: React.ReactNode;
};

export type ContentProps = {
	elevation?: number;
	maxWidth?: CSSProperties[ 'maxWidth' ];
	children: React.ReactNode;
};
