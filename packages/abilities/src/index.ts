/**
 * WordPress Abilities API Client
 *
 * This package provides a client for interacting with the
 * WordPress Abilities API, allowing you to list, retrieve, and execute
 * abilities from client-side code.
 *
 * @package
 */

/**
 * Public API functions
 */
export {
	getAbilities,
	getAbility,
	getAbilityCategories,
	getAbilityCategory,
	executeAbility,
	registerAbility,
	unregisterAbility,
	registerAbilityCategory,
	unregisterAbilityCategory,
} from './api';

/**
 * The store can be used directly with @wordpress/data via selectors
 * in React components with useSelect.
 *
 * @example
 * ```js
 * import { useSelect } from '@wordpress/data';
 * import { store as abilitiesStore } from '@wordpress/abilities';
 *
 * function MyComponent() {
 *   const abilities = useSelect(
 *     (select) => select(abilitiesStore).getAbilities(),
 *     []
 *   );
 *   // Use abilities...
 * }
 * ```
 */
export { store } from './store';

/**
 * Type definitions
 */
export type {
	Ability,
	AbilityCategory,
	AbilityCategoryArgs,
	AbilitiesState,
	AbilitiesQueryArgs,
	AbilityCallback,
	PermissionCallback,
	AbilityInput,
	AbilityOutput,
	ValidationError,
} from './types';

/**
 * Validation utilities
 */
export { validateValueFromSchema } from './validation';
