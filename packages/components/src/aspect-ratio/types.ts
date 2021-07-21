/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { CSSProperties, ReactNode } from 'react';

export type AspectRatioProps = {
	/**
	 * The width:height ratio to render.
	 *
	 * @default 1
	 *
	 * @example
	 * ```
	 * <AspectRatio ratio={16/9} />
	 * ```
	 */
	ratio?: number;
	/**
	 * A custom width.
	 */
	width?: CSSProperties[ 'width' ];
	/**
	 * React children
	 */
	children: ReactNode;
};
