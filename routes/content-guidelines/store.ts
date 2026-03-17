/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import type {
	Categories,
	ContentGuidelinesState,
	RestGuidelinesResponse,
} from './types';

export type { Categories };
export const STORE_NAME = 'core/content-guidelines';

const DEFAULT_STATE: ContentGuidelinesState = {
	id: null,
	status: null,
	categories: {
		site: '',
		copy: '',
		images: '',
		additional: '',
		blocks: {},
	},
};

const CATEGORIES = [ 'site', 'copy', 'images', 'additional', 'blocks' ];

const actions = {
	setFromResponse( response: RestGuidelinesResponse ) {
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
	setBlockGuideline( blockName: string, value: string ) {
		return {
			type: 'SET_BLOCK_GUIDELINE' as const,
			blockName,
			value,
		};
	},
};

type Action = ReturnType< ( typeof actions )[ keyof typeof actions ] >;

function parseResponse(
	response: RestGuidelinesResponse | null | undefined
): Partial< ContentGuidelinesState > {
	if ( ! response || typeof response !== 'object' ) {
		return {};
	}

	const categoriesFromResponse = response.guideline_categories ?? {};

	const result = {
		id: response.id ?? null,
		status: response.status ?? null,
		categories: {
			site: '',
			copy: '',
			images: '',
			additional: '',
			blocks: {},
		},
	};

	CATEGORIES.forEach( ( category ) => {
		const guidelines = categoriesFromResponse?.[ category ]?.guidelines;
		if ( typeof guidelines === 'string' ) {
			result.categories[ category ] = guidelines;
		} else if ( category === 'blocks' ) {
			const blocks = categoriesFromResponse?.blocks ?? {};
			for ( const [ blockName, blockData ] of Object.entries( blocks ) ) {
				result.categories.blocks[ blockName ] = blockData?.guidelines;
			}
		}
	} );

	return result;
}

function reducer(
	state: ContentGuidelinesState = DEFAULT_STATE,
	action: Action
): ContentGuidelinesState {
	switch ( action.type ) {
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
		case 'SET_BLOCK_GUIDELINE': {
			const blocks = {
				...state.categories.blocks,
				[ action.blockName ]: action.value,
			};

			if ( action.value === undefined ) {
				delete blocks[ action.blockName ];
			}

			return {
				...state,
				categories: {
					...state.categories,
					blocks,
				},
			};
		}
		default:
			return state;
	}
}

const selectors = {
	getGuideline(
		state: ContentGuidelinesState,
		category: string
	): string | Record< string, string > {
		return state.categories[ category ];
	},
	getAllGuidelines( state: ContentGuidelinesState ): Categories {
		return state.categories;
	},
	getBlockGuidelines(
		state: ContentGuidelinesState
	): Record< string, string > {
		return state.categories.blocks;
	},
	getBlockGuideline(
		state: ContentGuidelinesState,
		blockName: string
	): string {
		return state.categories.blocks[ blockName ] ?? '';
	},
	getId( state: ContentGuidelinesState ): number | null {
		return state.id;
	},
	getStatus( state: ContentGuidelinesState ): string | null {
		return state.status;
	},
};

export const store = createReduxStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( store );
