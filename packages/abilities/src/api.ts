/**
 * WordPress dependencies
 */
import { dispatch, resolveSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
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
 * @return Promise resolving to array of abilities.
 */
export async function getAbilities(
	args: AbilitiesQueryArgs = {}
): Promise< Ability[] > {
	return await resolveSelect( store ).getAbilities( args );
}

/**
 * Get a specific ability by name.
 *
 * @param name The ability name.
 * @return Promise resolving to the ability or null if not found.
 */
export async function getAbility( name: string ): Promise< Ability | null > {
	return await resolveSelect( store ).getAbility( name );
}

/**
 * Get all available ability categories.
 *
 * @return Promise resolving to array of categories.
 */
export async function getAbilityCategories(): Promise< AbilityCategory[] > {
	return await resolveSelect( store ).getAbilityCategories();
}

/**
 * Get a specific ability category by slug.
 *
 * @param slug The category slug.
 * @return Promise resolving to the category or null if not found.
 */
export async function getAbilityCategory(
	slug: string
): Promise< AbilityCategory | null > {
	return await resolveSelect( store ).getAbilityCategory( slug );
}

/**
 * Register a client-side ability.
 *
 * Client abilities are executed locally in the browser and must include
 * a callback function. The ability will be validated by the store action,
 * and an error will be thrown if validation fails.
 *
 * Categories will be automatically fetched from the REST API if they
 * haven't been loaded yet, so you don't need to call getAbilityCategories()
 * before registering abilities.
 *
 * @param  ability The ability definition including callback.
 * @return Promise that resolves when registration is complete.
 * @throws {Error} If the ability fails validation.
 *
 * @example
 * ```js
 * await registerAbility({
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
export async function registerAbility( ability: Ability ): Promise< void > {
	await dispatch( store ).registerAbility( ability );
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
 * Categories will be automatically fetched from the REST API if they haven't been
 * loaded yet to check for duplicates against server-side categories.
 *
 * @param  slug Category slug (lowercase alphanumeric with dashes only).
 * @param  args Category arguments (label, description, optional meta).
 * @return Promise that resolves when registration is complete.
 * @throws {Error} If the category fails validation.
 *
 * @example
 * ```js
 * // Register a new category for block editor abilities
 * await registerAbilityCategory('block-editor', {
 *   label: 'Block Editor',
 *   description: 'Abilities for interacting with the WordPress block editor'
 * });
 *
 * // Then register abilities using this category
 * await registerAbility({
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
export async function registerAbilityCategory(
	slug: string,
	args: AbilityCategoryArgs
): Promise< void > {
	await dispatch( store ).registerAbilityCategory( slug, args );
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
 * Execute a client-side ability.
 *
 * @param ability The ability to execute.
 * @param input   Input parameters for the ability.
 * @return Promise resolving to the ability execution result.
 * @throws Error if validation fails or execution errors.
 */
async function executeClientAbility(
	ability: Ability,
	input: AbilityInput
): Promise< AbilityOutput > {
	if ( ! ability.callback ) {
		throw new Error(
			sprintf(
				'Client ability %s is missing callback function',
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

	let result: AbilityOutput;
	try {
		result = await ability.callback( input );
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error(
			`Error executing client ability ${ ability.name }:`,
			error
		);
		throw error;
	}

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

/**
 * Execute a server-side ability.
 *
 * @param ability The ability to execute.
 * @param input   Input parameters for the ability.
 * @return Promise resolving to the ability execution result.
 * @throws Error if the API call fails.
 */
async function executeServerAbility(
	ability: Ability,
	input: AbilityInput
): Promise< AbilityOutput > {
	let method = 'POST';
	if ( !! ability.meta?.annotations?.readonly ) {
		method = 'GET';
	} else if (
		!! ability.meta?.annotations?.destructive &&
		!! ability.meta?.annotations?.idempotent
	) {
		method = 'DELETE';
	}

	let path = `/wp-abilities/v1/abilities/${ ability.name }/run`;
	const options: {
		method: string;
		data?: { input: AbilityInput };
	} = {
		method,
	};

	if ( [ 'GET', 'DELETE' ].includes( method ) && input !== null ) {
		// For GET and DELETE requests, pass the input directly.
		path = addQueryArgs( path, { input } );
	} else if ( method === 'POST' && input !== null ) {
		options.data = { input };
	}

	// Note: Input and output validation happens on the server side for these abilities.
	try {
		return await apiFetch< AbilityOutput >( {
			path,
			...options,
		} );
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error( `Error executing ability ${ ability.name }:`, error );
		throw error;
	}
}

/**
 * Execute an ability.
 *
 * Determines whether to execute locally (client abilities) or remotely (server abilities)
 * based on whether the ability has a callback function.
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
	const ability = await getAbility( name );
	if ( ! ability ) {
		throw new Error( sprintf( 'Ability not found: %s', name ) );
	}

	if ( ability.callback ) {
		return executeClientAbility( ability, input );
	}

	return executeServerAbility( ability, input );
}
