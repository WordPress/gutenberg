import { CSSProperties } from 'react';

import { FlexProps } from '../flex/types';

export type ControlGroupContext = {
	isFirst?: boolean;
	isLast?: boolean;
	isMidde?: boolean;
	isOnly?: boolean;
	isVertical?: boolean;
	styles?: string;
};

export type Props = Pick< FlexProps, 'direction' > & {
	/**
	 * Adjust the layout (width) of content using CSS grid (`grid-template-columns`).
	 */
	templateColumns?: CSSProperties[ 'gridTemplateColumns' ];
};
