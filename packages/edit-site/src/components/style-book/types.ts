type Block = {
	name: string;
	attributes: Record< string, unknown >;
	innerBlocks: Block[];
};

export type StyleBookCategory = {
	title: string;
	slug: string;
	blocks?: string[];
	exclude?: string[];
	subcategories?: StyleBookCategory[];
};

export type BlockExample = {
	name: string;
	title: string;
	category: string;
	blocks: Block;
};

export type CategoryExamples = {
	title: string;
	slug: string;
	examples?: BlockExample[];
	subcategories?: CategoryExamples[];
};
