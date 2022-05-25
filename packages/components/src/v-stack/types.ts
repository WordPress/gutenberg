/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

/**
 * Internal dependencies
 */
import type { HStackAlignment, Props as HStackProps } from '../h-stack/types';

export type Props = HStackProps & {
	alignment?: HStackAlignment | CSSProperties[ 'alignItems' ];
	spacing?: CSSProperties[ 'width' ];
};
