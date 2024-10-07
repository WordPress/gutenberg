/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

export interface FlexiGridProps
	extends Pick< CSSProperties, 'gap' | 'columnGap' | 'rowGap' > {
	minCellWidth: CSSProperties[ 'minWidth' ];
	maxCellWidth?: CSSProperties[ 'maxWidth' ];
}

export interface FlexiGridCellProps {
	id?: HTMLElement[ 'id' ];
}
