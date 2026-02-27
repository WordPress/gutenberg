/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import type { BlockGuideline, GuidelineCategories, Revision } from './types';

export const STORE_NAME = 'core/content-guidelines';

export interface ContentGuidelinesState {
	id: number | null;
	status: string | null;
	categories: Record< string, string >;
	// Actions fork additions:
	blocks: BlockGuideline[];
	revisions: Array< Revision & { categories: GuidelineCategories } >;
	currentRevisionId: number | null;
}

const DEFAULT_STATE: ContentGuidelinesState = {
	id: null,
	status: null,
	categories: {},
	blocks: [],
	revisions: [],
	currentRevisionId: null,
};

const CATEGORIES = [ 'site', 'copy', 'images', 'additional' ];

const actions = {
	// Categories fork actions (unchanged):
	setFromResponse( response: unknown ) {
		return {
			type: 'SET_FROM_RESPONSE' as const,
			response,
		};
	},
	setGuideline( category: string, value: string ) {
		return {
			type: 'SET_GUIDELINE' as const,
			category,
			value,
		};
	},
	// Actions fork additions:
	setBlocks( blocks: BlockGuideline[] ) {
		return {
			type: 'SET_BLOCKS' as const,
			blocks,
		};
	},
	setRevisions(
		revisions: Array< Revision & { categories: GuidelineCategories } >
	) {
		return {
			type: 'SET_REVISIONS' as const,
			revisions,
		};
	},
	setCurrentRevisionId( revisionId: number | null ) {
		return {
			type: 'SET_CURRENT_REVISION_ID' as const,
			revisionId,
		};
	},
};

type Action = ReturnType< ( typeof actions )[ keyof typeof actions ] >;

function parseResponse( response: unknown ): Partial< ContentGuidelinesState > {
	if ( ! response || typeof response !== 'object' ) {
		return {};
	}

	const data = response as {
		id?: unknown;
		status?: unknown;
		guideline_categories?: Record< string, { guidelines?: unknown } >;
	};

	const categoriesFromResponse = data.guideline_categories ?? {};

	const result: Partial< ContentGuidelinesState > = {
		id: data.id as number | null,
		status: data.status as string | null,
		categories: {},
		blocks: [],
	};

	CATEGORIES.forEach( ( category ) => {
		const guidelines = categoriesFromResponse?.[ category ]?.guidelines;
		if ( typeof guidelines === 'string' ) {
			result.categories![ category ] = guidelines;
		}
	} );

	// Parse blocks if present in the response
	const blocksFromResponse = categoriesFromResponse?.blocks;
	if ( Array.isArray( blocksFromResponse ) ) {
		result.blocks = blocksFromResponse as BlockGuideline[];
	}

	return result;
}

function reducer(
	state: ContentGuidelinesState = DEFAULT_STATE,
	action: Action
): ContentGuidelinesState {
	switch ( action.type ) {
		// Categories fork cases (unchanged):
		case 'SET_FROM_RESPONSE':
			return {
				...state,
				...parseResponse( action.response ),
			};
		case 'SET_GUIDELINE':
			return {
				...state,
				categories: {
					...state.categories,
					[ action.category ]: action.value,
				},
			};
		// Actions fork additions:
		case 'SET_BLOCKS':
			return {
				...state,
				blocks: action.blocks,
			};
		case 'SET_REVISIONS':
			return {
				...state,
				revisions: action.revisions,
			};
		case 'SET_CURRENT_REVISION_ID':
			return {
				...state,
				currentRevisionId: action.revisionId,
			};
		default:
			return state;
	}
}

const selectors = {
	// Categories fork selectors (unchanged):
	getGuideline( state: ContentGuidelinesState, category: string ): string {
		return state.categories[ category ] ?? '';
	},
	getAllGuidelines(
		state: ContentGuidelinesState
	): Partial< Record< string, string > > {
		return state.categories;
	},
	getId( state: ContentGuidelinesState ): number | null {
		return state.id;
	},
	getStatus( state: ContentGuidelinesState ): string | null {
		return state.status;
	},
	// Actions fork additions:
	getBlocks( state: ContentGuidelinesState ): BlockGuideline[] {
		return state.blocks;
	},
	getRevisions(
		state: ContentGuidelinesState
	): Array< Revision & { categories: GuidelineCategories } > {
		return state.revisions;
	},
	getCurrentRevisionId( state: ContentGuidelinesState ): number | null {
		return state.currentRevisionId;
	},
};

export const store = createReduxStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( store );
