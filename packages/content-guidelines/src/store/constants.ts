/**
 * Store name.
 */
export const STORE_NAME = 'content-guidelines';

/**
 * Types for the store.
 */
export interface CategoryGuideline {
	label?: string;
	guidelines: string;
}

export interface BlockGuidelines {
	[ blockName: string ]: {
		guidelines: string;
	};
}

export interface GuidelineCategories {
	copy: CategoryGuideline;
	images: CategoryGuideline;
	site: CategoryGuideline;
	blocks: BlockGuidelines;
	other: CategoryGuideline;
}

export interface Guidelines {
	id: number;
	status: 'draft' | 'published';
	guideline_categories: GuidelineCategories;
	date?: string;
	date_gmt?: string;
	modified?: string;
	modified_gmt?: string;
	author?: number;
	author_name?: string;
}

export interface Revision {
	id: number;
	date: string;
	author_name: string;
}

export interface State {
	guidelines: Guidelines | null;
	originalGuidelines: Guidelines | null;
	isLoading: boolean;
	isSaving: boolean;
	error: string | null;
	revisions: Revision[];
	isLoadingRevisions: boolean;
	isRestoring: number | null;
}

/**
 * Default guideline categories.
 */
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
	blocks: {},
	other: {
		label: 'Other Guidelines',
		guidelines: '',
	},
};

/**
 * Default state.
 */
export const DEFAULT_STATE: State = {
	guidelines: null,
	originalGuidelines: null,
	isLoading: false,
	isSaving: false,
	error: null,
	revisions: [],
	isLoadingRevisions: false,
	isRestoring: null,
};
