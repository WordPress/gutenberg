/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import type { Ability, AbilityCategory } from '../types';
import {
	RECEIVE_ABILITIES,
	REGISTER_ABILITY,
	UNREGISTER_ABILITY,
	RECEIVE_CATEGORIES,
	REGISTER_ABILITY_CATEGORY,
	UNREGISTER_ABILITY_CATEGORY,
} from './constants';

/**
 * Valid keys for an Ability object.
 * Used to filter out non-standard properties from server responses.
 */
const ABILITY_KEYS = [
	'name',
	'label',
	'description',
	'category',
	'input_schema',
	'output_schema',
	'meta',
	'callback',
	'permissionCallback',
] as const;

/**
 * Valid keys for an AbilityCategory object.
 * Used to filter out non-standard properties from server responses.
 */
const CATEGORY_KEYS = [ 'slug', 'label', 'description', 'meta' ] as const;

/**
 * Filters an ability object to only include valid properties.
 * This ensures consistent shape regardless of source (server/client).
 *
 * @param ability Raw ability object that may contain extra properties.
 * @return Filtered ability with only valid properties.
 */
function filterAbility( ability: any ): Ability {
	return Object.keys( ability )
		.filter(
			( key ) =>
				ABILITY_KEYS.includes( key as any ) &&
				ability[ key ] !== undefined
		)
		.reduce(
			( obj, key ) => ( { ...obj, [ key ]: ability[ key ] } ),
			{} as Ability
		);
}

/**
 * Filters a category object to only include valid properties.
 * This ensures consistent shape regardless of source.
 *
 * @param category Raw category object that may contain extra properties.
 * @return Filtered category with only valid properties.
 */
function filterCategory( category: any ): AbilityCategory {
	return Object.keys( category )
		.filter(
			( key ) =>
				CATEGORY_KEYS.includes( key as any ) &&
				category[ key ] !== undefined
		)
		.reduce(
			( obj, key ) => ( { ...obj, [ key ]: category[ key ] } ),
			{} as AbilityCategory
		);
}

interface AbilitiesAction {
	type: string;
	abilities?: Ability[];
	ability?: Ability;
	categories?: AbilityCategory[];
	category?: AbilityCategory;
	name?: string;
	slug?: string;
}

const DEFAULT_STATE: Record< string, Ability > = {};

/**
 * Reducer managing the abilities by name.
 *
 * @param state  Current state.
 * @param action Dispatched action.
 * @return New state.
 */
function abilitiesByName(
	state: Record< string, Ability > = DEFAULT_STATE,
	action: AbilitiesAction
): Record< string, Ability > {
	switch ( action.type ) {
		case RECEIVE_ABILITIES: {
			if ( ! action.abilities ) {
				return state;
			}
			const newState = { ...state };
			action.abilities.forEach( ( ability ) => {
				newState[ ability.name ] = filterAbility( ability );
			} );
			return newState;
		}
		case REGISTER_ABILITY: {
			if ( ! action.ability ) {
				return state;
			}
			return {
				...state,
				[ action.ability.name ]: filterAbility( action.ability ),
			};
		}
		case UNREGISTER_ABILITY: {
			if ( ! action.name || ! state[ action.name ] ) {
				return state;
			}
			const newState = { ...state };
			delete newState[ action.name ];
			return newState;
		}
		default:
			return state;
	}
}

const DEFAULT_CATEGORIES_STATE: Record< string, AbilityCategory > = {};

/**
 * Reducer managing the categories by slug.
 *
 * @param state  Current state.
 * @param action Dispatched action.
 * @return New state.
 */
function categoriesBySlug(
	state: Record< string, AbilityCategory > = DEFAULT_CATEGORIES_STATE,
	action: AbilitiesAction
): Record< string, AbilityCategory > {
	switch ( action.type ) {
		case RECEIVE_CATEGORIES: {
			if ( ! action.categories ) {
				return state;
			}
			const newState = { ...state };
			action.categories.forEach( ( category ) => {
				newState[ category.slug ] = filterCategory( category );
			} );
			return newState;
		}
		case REGISTER_ABILITY_CATEGORY: {
			if ( ! action.category ) {
				return state;
			}
			return {
				...state,
				[ action.category.slug ]: filterCategory( action.category ),
			};
		}
		case UNREGISTER_ABILITY_CATEGORY: {
			if ( ! action.slug || ! state[ action.slug ] ) {
				return state;
			}
			const newState = { ...state };
			delete newState[ action.slug ];
			return newState;
		}
		default:
			return state;
	}
}

export default combineReducers( {
	abilitiesByName,
	categoriesBySlug,
} );
