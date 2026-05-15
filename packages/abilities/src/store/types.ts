/**
 * Internal dependencies
 */
import type { Ability, AbilityCategory } from '../types';

/**
 * The state shape for the abilities store.
 */
export interface AbilitiesState {
	/**
	 * Map of ability names to ability objects.
	 */
	abilitiesByName: Record< string, Ability >;

	/**
	 * Map of category slugs to category objects.
	 */
	categoriesBySlug: Record< string, AbilityCategory >;
}
