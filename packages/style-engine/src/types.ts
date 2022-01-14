export type Box = {
	top?: string;
	bottom?: string;
	left?: string;
	right?: string;
};

export interface Style {
	spacing?: {
		padding?: string | Box;
		margin?: string | Box;
		lineHeight?: string;
		fontSize?: string;
		fontFamily?: string;
		fontWeight?: string;
		fontStyle?: string;
		textDecoration?: string;
		textTransform?: string;
		letterSpacing?: string;
	};
}

export type GeneratedCSSRule = {
	selector: string;
	value: string;
	key: string;
};

export interface StyleDefinition {
	name: string;
	generate: ( style: Style, selector: string ) => GeneratedCSSRule[];
}
