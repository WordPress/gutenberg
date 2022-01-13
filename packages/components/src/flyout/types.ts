/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { PopoverStateReturn } from 'reakit';
import type { CSSProperties, FunctionComponentElement } from 'react';

/**
 * Internal dependencies
 */
import type { PopperProps } from '../utils/types';

export type Context = {
	flyoutState?: PopoverStateReturn;
	label?: string;
};

export type Props = PopperProps & {
	state?: PopoverStateReturn;
	label?: string;
	/**
	 * Determines if `Flyout` has animations.
	 *
	 * @default true
	 */
	animated?: boolean;
	/**
	 * The duration of `Flyout` animations.
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
	 * Renders `Elevation` styles for the `Flyout`.
	 *
	 * @default 5
	 */
	elevation?: number;
	/**
	 * Max-width for the `Flyout` element.
	 *
	 * @default 360
	 */
	maxWidth?: CSSProperties[ 'maxWidth' ];
	/**
	 * Callback for when the `visible` state changes.
	 */
	onVisibleChange?: ( ...args: any ) => void;
	/**
	 * Element that triggers the `visible` state of `Flyout` when clicked.
	 *
	 * @example
	 * ```jsx
	 * <Flyout trigger={<Button>Greet</Button>}>
	 *  <Text>Hi! I'm Olaf!</Text>
	 * </Flyout>
	 * ```
	 */
	trigger: FunctionComponentElement< any >;
	/**
	 * Whether `Flyout` is visible.
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
	elevation: number;
	maxWidth: CSSProperties[ 'maxWidth' ];
	children: React.ReactNode;
};
