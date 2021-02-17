/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { CSSProperties } from 'react';

/**
 * Internal dependencies
 */
import { HStackAlignment, Props as HStackProps } from '../h-stack/types';

export type Props = HStackProps & {
	alignment?: HStackAlignment | CSSProperties[ 'alignItems' ];
	spacing?: CSSProperties[ 'width' ];
};
