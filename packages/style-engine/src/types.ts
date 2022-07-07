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

export type BorderIndividualProperty = 'top' | 'right' | 'bottom' | 'left';
// `T` is one of the values in `BorderIndividualProperty`. The expected CSSProperties key is something like `borderTopColor`.
export type BorderIndividualStyles< T extends BorderIndividualProperty > = {
	color?: CSSProperties[ `border${ Capitalize< string & T > }Color` ];
	style?: CSSProperties[ `border${ Capitalize< string & T > }Style` ];
	width?: CSSProperties[ `border${ Capitalize< string & T > }Width` ];
};

export interface Style {
	border?: {
		color?: CSSProperties[ 'borderColor' ];
		radius?:
			| CSSProperties[ 'borderRadius' ]
			| {
					topLeft?: CSSProperties[ 'borderTopLeftRadius' ];
					topRight?: CSSProperties[ 'borderTopRightRadius' ];
					bottomLeft?: CSSProperties[ 'borderBottomLeftRadius' ];
					bottomRight?: CSSProperties[ 'borderBottomLeftRadius' ];
			  };
		style?: CSSProperties[ 'borderStyle' ];
		width?: CSSProperties[ 'borderWidth' ];
		top?: BorderIndividualStyles< 'top' >;
		right?: BorderIndividualStyles< 'right' >;
		bottom?: BorderIndividualStyles< 'bottom' >;
		left?: BorderIndividualStyles< 'left' >;
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
	color?: {
		text?: CSSProperties[ 'color' ];
		background?: CSSProperties[ 'backgroundColor' ];
		gradient?: CSSProperties[ 'background' ];
	};
	elements?: {
		link?: {
			color?: {
				text?: CSSProperties[ 'color' ];
			};
		};
	};
}

export type CssRulesKeys = { default: string; individual: string };

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
	generate?: (
		style: Style,
		options: StyleOptions,
		path?: string[],
		ruleKey?: string
	) => GeneratedCSSRule[];
	getClassNames?: ( style: Style ) => string[];
}
