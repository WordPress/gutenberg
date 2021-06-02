/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { CSSProperties } from 'react';

export type Props = {
	/**
	 * Renders the active (interaction) shadow value.
	 */
	active?: number;
	/**
	 * Renders the border-radius of the shadow.
	 */
	borderRadius?: CSSProperties[ 'borderRadius' ];
	/**
	 * Renders the focus (interaction) shadow value.
	 */
	focus?: number;
	/**
	 * Renders the hover (interaction) shadow value.
	 */
	hover?: number;
	/**
	 * Determines if hover, active, and focus shadow values should be automatically calculated and rendered.
	 */
	isInteractive?: boolean;
	/**
	 * Dimensional offsets (margin) for the shadow.
	 */
	offset?: number;
	/**
	 * Size of the shadow, based on the Style system's elevation system. The `value` determines the strength of the shadow, which sense of depth.
	 * In the example below, `isInteractive` is activated to give a better sense of depth.
	 */
	value?: number;
};
