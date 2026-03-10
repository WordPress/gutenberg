/**
 * WordPress dependencies
 */
import { dispatch, select } from '@wordpress/data';
import { sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store } from './store';
import type {
	Ability,
	AbilityCategory,
	AbilityCategoryArgs,
	AbilitiesQueryArgs,
	AbilityInput,
	AbilityOutput,
} from './types';
import { validateValueFromSchema } from './validation';

/**
 * Get all available abilities with optional filtering.
 *
 * @param args Optional query arguments to filter. Defaults to empty object.
 * @return Array of abilities.
 */
export function getAbilities( args: AbilitiesQueryArgs = {} ): Ability[] {
	return select( store ).getAbilities( args );
}

/**
 * Get a specific ability by name.
 *
 * @param name The ability name.
 * @return The ability or undefined if not found.
 */
export function getAbility( name: string ): Ability | undefined {
	return select( store ).getAbility( name );
}

/**
 * Get all available ability categories.
 *
 * @return Array of categories.
 */
export function getAbilityCategories(): AbilityCategory[] {
	return select( store ).getAbilityCategories();
}

/**
 * Get a specific ability category by slug.
 *
 * @param slug The category slug.
 * @return The category or undefined if not found.
 */
export function getAbilityCategory(
	slug: string
): AbilityCategory | undefined {
	return select( store ).getAbilityCategory( slug );
}

/**
 * Register a client-side ability.
 *
 * Client abilities are executed locally in the browser and must include
 * a callback function. The ability will be validated by the store action,
 * and an error will be thrown if validation fails.
 *
 * The category must already be registered before registering abilities.
 *
 * @param  ability The ability definition including callback.
 * @throws {Error} If the ability fails validation.
 *
 * @example
 * ```js
 * registerAbility({
 *   name: 'my-plugin/navigate',
 *   label: 'Navigate to URL',
 *   description: 'Navigates to a URL within WordPress admin',
 *   category: 'navigation',
 *   input_schema: {
 *     type: 'object',
 *     properties: {
 *       url: { type: 'string' }
 *     },
 *     required: ['url']
 *   },
 *   callback: async ({ url }) => {
 *     window.location.href = url;
 *     return { success: true };
 *   }
 * });
 * ```
 */
export function registerAbility( ability: Ability ): void {
	dispatch( store ).registerAbility( ability );
}

/**
 * Unregister an ability from the store.
 *
 * Remove a client-side ability from the store.
 * Note: This will return an error for server-side abilities.
 *
 * @param name The ability name to unregister.
 */
export function unregisterAbility( name: string ): void {
	dispatch( store ).unregisterAbility( name );
}

/**
 * Register a client-side ability category.
 *
 * Categories registered on the client are stored alongside server-side categories
 * in the same store and can be used when registering client side abilities.
 * This is useful when registering client-side abilities that introduce new
 * categories not defined by the server.
 *
 * @param  slug Category slug (lowercase alphanumeric with dashes only).
 * @param  args Category arguments (label, description, optional meta).
 * @throws {Error} If the category fails validation.
 *
 * @example
 * ```js
 * // Register a new category for block editor abilities
 * registerAbilityCategory('block-editor', {
 *   label: 'Block Editor',
 *   description: 'Abilities for interacting with the WordPress block editor'
 * });
 *
 * // Then register abilities using this category
 * registerAbility({
 *   name: 'my-plugin/insert-block',
 *   label: 'Insert Block',
 *   description: 'Inserts a block into the editor',
 *   category: 'block-editor',
 *   callback: async ({ blockType }) => {
 *     // Implementation
 *     return { success: true };
 *   }
 * });
 * ```
 */
export function registerAbilityCategory(
	slug: string,
	args: AbilityCategoryArgs
): void {
	dispatch( store ).registerAbilityCategory( slug, args );
}

/**
 * Unregister an ability category.
 *
 * Removes a category from the store.
 *
 * @param slug The category slug to unregister.
 *
 * @example
 * ```js
 * unregisterAbilityCategory('block-editor');
 * ```
 */
export function unregisterAbilityCategory( slug: string ): void {
	dispatch( store ).unregisterAbilityCategory( slug );
}

/**
 * Execute an ability.
 *
 * Executes abilities with validation for client-side abilities only.
 * Server abilities bypass validation as it's handled on the server.
 *
 * @param name  The ability name.
 * @param input Optional input parameters for the ability.
 * @return Promise resolving to the ability execution result.
 * @throws Error if the ability is not found or execution fails.
 */
export async function executeAbility(
	name: string,
	input?: AbilityInput
): Promise< AbilityOutput > {
	const ability = getAbility( name );
	if ( ! ability ) {
		throw new Error( sprintf( 'Ability not found: %s', name ) );
	}

	if ( ! ability.callback ) {
		throw new Error(
			sprintf(
				'Ability "%s" is missing callback. Please ensure the ability is properly registered.',
				ability.name
			)
		);
	}

	// Check permission callback if defined
	if ( ability.permissionCallback ) {
		const hasPermission = await ability.permissionCallback( input );
		if ( ! hasPermission ) {
			const error = new Error(
				sprintf( 'Permission denied for ability: %s', ability.name )
			);
			( error as any ).code = 'ability_permission_denied';
			throw error;
		}
	}

	// Validate input
	if ( ability.input_schema ) {
		const inputValidation = validateValueFromSchema(
			input,
			ability.input_schema,
			'input'
		);
		if ( inputValidation !== true ) {
			const error = new Error(
				sprintf(
					'Ability "%1$s" has invalid input. Reason: %2$s',
					ability.name,
					inputValidation
				)
			);
			( error as any ).code = 'ability_invalid_input';
			throw error;
		}
	}

	// Execute the ability
	let result: AbilityOutput;
	try {
		result = await ability.callback( input );
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error( `Error executing ability ${ ability.name }:`, error );
		throw error;
	}

	// Validate output
	if ( ability.output_schema ) {
		const outputValidation = validateValueFromSchema(
			result,
			ability.output_schema,
			'output'
		);
		if ( outputValidation !== true ) {
			const error = new Error(
				sprintf(
					'Ability "%1$s" has invalid output. Reason: %2$s',
					ability.name,
					outputValidation
				)
			);
			( error as any ).code = 'ability_invalid_output';
			throw error;
		}
	}

	return result;
}
