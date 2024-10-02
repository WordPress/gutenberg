type Block = {
	name: string;
	attributes: Record< string, unknown >;
	innerBlocks?: Block[];
};

export type StyleBookCategory = {
	title: string;
	slug: string;
	blocks?: string[];
	exclude?: string[];
	include?: string[];
	subcategories?: StyleBookCategory[];
};

export type BlockExample = {
	name: string;
	title: string;
	category: string;
	content?: JSX.Element;
	blocks?: Block | Block[];
};

export type CategoryExamples = {
	title: string;
	slug: string;
	examples?: BlockExample[];
	subcategories?: CategoryExamples[];
};

export type StyleBookColorGroup = {
	origin: string;
	slug: string;
	title: string;
	type: string;
};

export type Color = { slug: string };
export type Gradient = { slug: string };
export type Duotone = {
	colors: string[];
	slug: string;
};

export type ColorOrigin = {
	name: string;
	slug: string;
	colors?: Color[];
	gradients?: Gradient[];
	duotones?: Duotone[];
};

export type MultiOriginPalettes = {
	disableCustomColors: boolean;
	disableCustomGradients: boolean;
	hasColorsOrGradients: boolean;
	colors: Omit< ColorOrigin, 'gradients' | 'duotones' >;
	duotones: Omit< ColorOrigin, 'colors' | 'gradients' >;
	gradients: Omit< ColorOrigin, 'colors' | 'duotones' >;
};
