/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

export type ElevationProps = {
	/**
	 * Size of the shadow value when active (see the `value` and `isInteractive`
	 * props).
	 */
	active?: number;
	/**
	 * Renders the border-radius of the shadow.
	 *
	 * @default 'inherit'
	 */
	borderRadius?: CSSProperties[ 'borderRadius' ];
	/**
	 * Size of the shadow value when focused (see the `value` and
	 * `isInteractive` props).
	 */
	focus?: number;
	/**
	 * Size of the shadow value when hovered (see the `value` and
	 * `isInteractive` props).
	 */
	hover?: number;
	/**
	 * Determines if `hover`, `active`, and `focus` shadow values should be
	 * automatically calculated and rendered.
	 *
	 * @default false
	 */
	isInteractive?: boolean;
	/**
	 * Dimensional offsets (margin) for the shadow.
	 *
	 * @default 0
	 */
	offset?: number;
	/**
	 * Size of the shadow, based on the Style system's elevation system. The
	 * `value` determines the strength of the shadow, which creates the sense of
	 * depth.
	 *
	 * @default 0
	 */
	value?: number;
};
