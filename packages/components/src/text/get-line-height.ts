/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

/**
 * Internal dependencies
 */
import type { Props } from './types';
import { space } from '../ui/utils/space';
import { CONFIG } from '../utils';

export function getLineHeight(
	adjustLineHeightForInnerControls: Props[ 'adjustLineHeightForInnerControls' ],
	lineHeight: CSSProperties[ 'lineHeight' ]
) {
	if ( lineHeight ) return lineHeight;

	if ( ! adjustLineHeightForInnerControls ) return;

	let value = `calc(${ CONFIG.controlHeight } + ${ space( 2 ) })`;

	switch ( adjustLineHeightForInnerControls ) {
		case 'large':
			value = `calc(${ CONFIG.controlHeightLarge } + ${ space( 2 ) })`;
			break;
		case 'small':
			value = `calc(${ CONFIG.controlHeightSmall } + ${ space( 2 ) })`;
			break;
		case 'xSmall':
			value = `calc(${ CONFIG.controlHeightXSmall } + ${ space( 2 ) })`;
			break;
		default:
			break;
	}

	return value;
}
