/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { PopoverStateReturn } from 'reakit';
// eslint-disable-next-line no-restricted-imports
import type { CSSProperties } from 'react';

/**
 * Internal dependencies
 */
import type { PopperProps } from '../utils/types';

export type Context = PopoverStateReturn;

export type Props = PopperProps & {
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
	onToggle?: ( isOpen: boolean ) => void;
	/**
	 * Whether `Flyout` is open.
	 *
	 * @default false
	 *
	 * @see https://reakit.io/docs/popover/#usepopoverstate
	 */
	isOpen?: boolean;
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
