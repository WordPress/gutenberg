/**
 * External dependencies
 */
import { css, getHighDpi, ui } from '@wp-g2/styles';

const lineHeight = `calc(${ ui.get( 'fontSize' ) } * 1.2)`;

/* eslint-disable jsdoc/valid-types */
/**
 * @param {Parameters<typeof ui.get>[0]} size The padding size.
 */
/* eslint-enable jsdoc/valid-types */
function getPadding( size ) {
	return `calc((${ ui.get( size ) } - ${ lineHeight }) / 2)`;
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
