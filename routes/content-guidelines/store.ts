/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import type { ContentGuidelinesState, RestGuidelinesResponse } from './types';

export const STORE_NAME = 'core/content-guidelines';

const DEFAULT_STATE: ContentGuidelinesState = {
	id: null,
	status: null,
	categories: {},
};

const CATEGORIES = [ 'site', 'copy', 'images', 'additional' ];

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
		categories: {},
	};

	CATEGORIES.forEach( ( category ) => {
		const guidelines = categoriesFromResponse?.[ category ]?.guidelines;
		if ( typeof guidelines === 'string' ) {
			result.categories[ category ] = guidelines;
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
};

export const store = createReduxStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( store );
