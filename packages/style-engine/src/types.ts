export type Box = {
	top?: string;
	right?: string;
	bottom?: string;
	left?: string;
};

export interface Style {
	spacing?: {
		margin?: string | Box;
		padding?: string | Box;
	};
	typography?: {
		fontSize?: string;
		fontFamily?: string;
		fontWeight?: string;
		fontStyle?: string;
		letterSpacing?: string;
		lineHeight?: string;
		textDecoration?: string;
		textTransform?: string;
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
