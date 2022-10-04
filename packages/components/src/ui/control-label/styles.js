/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import CONFIG from '../../utils/config-values';
import { getHighDpi } from '../utils/get-high-dpi';

const lineHeight = `calc(${ CONFIG.fontSize } * 1.2)`;

/**
 * @param {keyof CONFIG} size The padding size.
 */
function getPadding( size ) {
	return `calc((${ CONFIG[ size ] } - ${ lineHeight }) / 2)`;
}

const highDpiAdjust = getHighDpi`
	> * {
		position: relative;
		top: 0.5px;
	}
`;

export const ControlLabel = css`
	display: inline-block;
	line-height: ${ lineHeight };
	margin: 0;
	max-width: 100%;
	padding-bottom: ${ getPadding( 'controlHeight' ) };
	padding-top: ${ getPadding( 'controlHeight' ) };

	&:active {
		user-select: none;
	}

	${ highDpiAdjust };
`;

export const large = css`
	padding-bottom: ${ getPadding( 'controlHeightLarge' ) };
	padding-top: ${ getPadding( 'controlHeightLarge' ) };
`;

export const medium = css`
	padding-bottom: ${ getPadding( 'controlHeight' ) };
	padding-top: ${ getPadding( 'controlHeight' ) };
`;

export const small = css`
	padding-bottom: ${ getPadding( 'controlHeightSmall' ) };
	padding-top: ${ getPadding( 'controlHeightSmall' ) };
`;

export const inline = css`
	display: inline-block;
	vertical-align: middle;
`;

export const block = css`
	display: block;
`;
