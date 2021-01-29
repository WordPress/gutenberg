/**
 * External dependencies
 */
import { CSSProperties } from 'react';
// eslint-disable-next-line no-restricted-imports
import { SeparatorProps } from 'reakit';

export type Props = SeparatorProps & {
	/**
	 * Adjusts all margins.
	 */
	m?: number | CSSProperties[ 'margin' ];
	/**
	 * Adjusts top margins.
	 */
	mt?: number | CSSProperties[ 'marginTop' ];
	/**
	 * Adjusts bottom margins.
	 */
	mb?: number | CSSProperties[ 'marginBottom' ];
};
