/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

export type ProgressBarProps = {
	/**
	 * Value of the progress bar.
	 */
	value?: number;

	/**
	 * Color of the progress bar indicator.
	 */
	indicatorColor?: CSSProperties[ 'color' ];

	/**
	 * Color of the progress bar track.
	 */
	trackColor?: CSSProperties[ 'color' ];
};
