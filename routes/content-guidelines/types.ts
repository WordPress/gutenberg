export interface CategoryGuideline {
	label?: string;
	guidelines: string;
}

export interface BlockGuideline {
	blockType: string;
	guidelines: string;
}

export interface GuidelineCategories {
	copy: CategoryGuideline;
	images: CategoryGuideline;
	site: CategoryGuideline;
	blocks: BlockGuideline[];
	additional: CategoryGuideline;
}

export interface Guidelines {
	id: number;
	status: 'draft' | 'published';
	guideline_categories: GuidelineCategories;
	date?: string;
	modified?: string;
	author?: number;
	author_name?: string;
}

export interface Revision {
	id: number;
	date: string;
	author_name: string;
}

export const DEFAULT_CATEGORIES: GuidelineCategories = {
	copy: {
		label: 'Copy Guidelines',
		guidelines: '',
	},
	images: {
		label: 'Image Guidelines',
		guidelines: '',
	},
	site: {
		label: 'Site Context',
		guidelines: '',
	},
	blocks: [],
	additional: {
		label: 'Other Guidelines',
		guidelines: '',
	},
};
