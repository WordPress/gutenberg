/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

export type Box = {
	top?: CSSProperties[ 'top' ];
	right?: CSSProperties[ 'right' ];
	bottom?: CSSProperties[ 'bottom' ];
	left?: CSSProperties[ 'left' ];
};

export interface Style {
	spacing?: {
		margin?: CSSProperties[ 'margin' ] | Box;
		padding?: CSSProperties[ 'padding' ] | Box;
	};
	typography?: {
		fontSize?: CSSProperties[ 'fontSize' ];
		fontFamily?: CSSProperties[ 'fontFamily' ];
		fontWeight?: CSSProperties[ 'fontWeight' ];
		fontStyle?: CSSProperties[ 'fontStyle' ];
		letterSpacing?: CSSProperties[ 'letterSpacing' ];
		lineHeight?: CSSProperties[ 'lineHeight' ];
		textDecoration?: CSSProperties[ 'textDecoration' ];
		textTransform?: CSSProperties[ 'textTransform' ];
	};
}

export type StyleOptions = {
	/**
	 * CSS selector for the generated style.
	 */
	selector: string;
};

export type GeneratedCSSRule = {
	selector: string;
	value: string;
	/**
	 * The CSS key in JS style attribute format, compatible with React.
	 * E.g. `paddingTop` instead of `padding-top`.
	 */
	key: string;
};

export interface StyleDefinition {
	name: string;
	generate: ( style: Style, options: StyleOptions ) => GeneratedCSSRule[];
}
