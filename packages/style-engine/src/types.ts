export type Box = {
	top?: string;
	bottom?: string;
	left?: string;
	right?: string;
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

export type GeneratedCSSRule = {
	selector: string;
	value: string;
	key: string;
};

export interface StyleDefinition {
	name: string;
	generate: ( style: Style, selector: string ) => GeneratedCSSRule[];
}
