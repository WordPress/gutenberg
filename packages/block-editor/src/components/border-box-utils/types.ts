/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

export type Border = {
	color?: CSSProperties[ 'borderColor' ];
	style?: CSSProperties[ 'borderStyle' ];
	width?: CSSProperties[ 'borderWidth' ];
};

export type Borders = {
	top?: Border;
	right?: Border;
	bottom?: Border;
	left?: Border;
};

export type AnyBorder = Border | Borders | undefined;
export type BorderProp = keyof Border;
export type BorderSide = keyof Borders;
