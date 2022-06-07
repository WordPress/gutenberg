/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

export type ColorIndicatorProps = {
	/**
	 * The color of the indicator. Any value from the background property is
	 * supported.
	 */
	colorValue: CSSProperties[ 'background' ];
};
