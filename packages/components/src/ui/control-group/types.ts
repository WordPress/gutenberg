/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

/**
 * Internal dependencies
 */
import type { FlexProps } from '../../flex/types';

export type ControlGroupContext = {
	isFirst?: boolean;
	isLast?: boolean;
	isMiddle?: boolean;
	isOnly?: boolean;
	isVertical?: boolean;
	styles?: string;
};

export type Props = Pick< FlexProps, 'direction' > & {
	/**
	 * Adjust the layout (width) of content using CSS grid (`grid-template-columns`).
	 */
	templateColumns?: CSSProperties[ 'gridTemplateColumns' ];
	/**
	 * The children elements.
	 */
	children: React.ReactNode;
};
