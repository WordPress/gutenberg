/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

export const STORE_NAME = 'core/content-guidelines';

export interface ContentGuidelinesState {
	id: number | null;
	status: string | null;
	categories: Partial< Record< string, string > >;
}

const DEFAULT_STATE: ContentGuidelinesState = {
	id: null,
	status: null,
	categories: {},
};

const actions = {
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
		id: typeof data.id === 'number' ? data.id : null,
		status: typeof data.status === 'string' ? data.status : null,
		categories: {},
	};

	[ 'site', 'copy', 'images', 'additional' ].forEach( ( slug ) => {
		const guidelines = categoriesFromResponse?.[ slug ]?.guidelines;
		if ( typeof guidelines === 'string' ) {
			( result.categories as Record< string, string > )[ slug ] =
				guidelines;
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
		default:
			return state;
	}
}

const selectors = {
	getGuideline( state: ContentGuidelinesState, slug: string ): string {
		return state.categories[ slug ] ?? '';
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
};

export const store = createReduxStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( store );
