/**
 * WordPress dependencies
 */
import { createSelector } from '@wordpress/data';

/**
 * Internal dependencies
 */
import type { Ability, AbilityCategory, AbilitiesQueryArgs } from '../types';
import type { AbilitiesState } from './types';

/**
 * Returns all registered abilities.
 * Optionally filters by query arguments.
 *
 * @param state Store state.
 * @param args  Optional query arguments to filter. Defaults to empty object.
 * @return Array of abilities.
 */
export const getAbilities = createSelector(
	(
		state: AbilitiesState,
		{ category }: AbilitiesQueryArgs = {}
	): Ability[] => {
		const abilities = Object.values( state.abilitiesByName );
		if ( category ) {
			return abilities.filter(
				( ability ) => ability.category === category
			);
		}
		return abilities;
	},
	( state: AbilitiesState, { category }: AbilitiesQueryArgs = {} ) => [
		state.abilitiesByName,
		category,
	]
);

/**
 * Returns a specific ability by name.
 *
 * @param state Store state.
 * @param name  Ability name.
 * @return Ability object or undefined if not found.
 */
export function getAbility(
	state: AbilitiesState,
	name: string
): Ability | undefined {
	return state.abilitiesByName[ name ];
}

/**
 * Returns all registered ability categories.
 *
 * @param state Store state.
 * @return Array of categories.
 */
export const getAbilityCategories = createSelector(
	( state: AbilitiesState ): AbilityCategory[] => {
		return Object.values( state.categoriesBySlug );
	},
	( state: AbilitiesState ) => [ state.categoriesBySlug ]
);

/**
 * Returns a specific ability category by slug.
 *
 * @param state Store state.
 * @param slug  Category slug.
 * @return Category object or undefined if not found.
 */
export function getAbilityCategory(
	state: AbilitiesState,
	slug: string
): AbilityCategory | undefined {
	return state.categoriesBySlug[ slug ];
}
