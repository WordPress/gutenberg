/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

type BoxVariants = 'margin' | 'padding' | undefined;
export type Box< T extends BoxVariants = undefined > = {
	top?: CSSProperties[ T extends undefined ? 'top' : `${ T }Top` ];
	right?: CSSProperties[ T extends undefined ? 'right' : `${ T }Right` ];
	bottom?: CSSProperties[ T extends undefined ? 'bottom' : `${ T }Bottom` ];
	left?: CSSProperties[ T extends undefined ? 'left' : `${ T }Left` ];
};

export interface Style {
	backgroundImage?: {
		url?: CSSProperties[ 'backgroundImage' ];
		source?: string;
	};
	spacing?: {
		margin?: CSSProperties[ 'margin' ] | Box< 'margin' >;
		padding?: CSSProperties[ 'padding' ] | Box< 'padding' >;
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
