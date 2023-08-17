/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

type BoxVariant = 'margin' | 'padding';
export interface Box< T extends BoxVariant | undefined = undefined > {
	top?: CSSProperties[ T extends undefined ? 'top' : `${ T }Top` ];
	right?: CSSProperties[ T extends undefined ? 'right' : `${ T }Right` ];
	bottom?: CSSProperties[ T extends undefined ? 'bottom' : `${ T }Bottom` ];
	left?: CSSProperties[ T extends undefined ? 'left' : `${ T }Left` ];
}

export type BoxEdge = 'top' | 'right' | 'bottom' | 'left';

// `T` is one of the values in `BorderIndividualProperty`. The expected CSSProperties key is something like `borderTopColor`.
export interface BorderIndividualStyles< T extends BoxEdge > {
	color?: CSSProperties[ `border${ Capitalize< T > }Color` ];
	style?: CSSProperties[ `border${ Capitalize< T > }Style` ];
	width?: CSSProperties[ `border${ Capitalize< T > }Width` ];
}

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
	dimensions?: {
		minHeight?: CSSProperties[ 'minHeight' ];
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
		textColumns?: CSSProperties[ 'columnCount' ];
		textDecoration?: CSSProperties[ 'textDecoration' ];
		textTransform?: CSSProperties[ 'textTransform' ];
		writingMode?: CSSProperties[ 'writingMode' ];
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

export interface CssRulesKeys {
	default: string;
	individual: string;
}

export interface StyleOptions {
	/**
	 * CSS selector for the generated style.
	 */
	selector?: string;
}

export interface GeneratedCSSRule {
	selector?: string;
	value: string;
	/**
	 * The CSS key in JS style attribute format, compatible with React.
	 * E.g. `paddingTop` instead of `padding-top`.
	 */
	key: string;
}

export interface GenerateFunction {
	( style: Style, options: StyleOptions ): GeneratedCSSRule[];
}

export interface StyleDefinition {
	name: string;
	generate?: GenerateFunction;
}
