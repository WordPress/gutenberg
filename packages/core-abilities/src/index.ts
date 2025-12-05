/**
 * WordPress dependencies
 */
import { registerAbility, registerAbilityCategory } from '@wordpress/abilities';
import type {
	Ability,
	AbilityCategory,
	AbilityInput,
	AbilityOutput,
} from '@wordpress/abilities';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Creates a serverCallback function for a WordPress REST API ability.
 *
 * @param ability The ability to create a callback for.
 * @return The serverCallback function.
 */
function createServerCallback(
	ability: Ability
): ( input: AbilityInput ) => Promise< AbilityOutput > {
	return async ( input: AbilityInput ) => {
		// Determine HTTP method based on ability annotations
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
			// For GET and DELETE requests, pass the input as query parameters.
			path = addQueryArgs( path, { input } );
		} else if ( method === 'POST' && input !== null ) {
			options.data = { input };
		}

		// Input and output validation happens on the server side for these abilities.
		return apiFetch< AbilityOutput >( {
			path,
			...options,
		} );
	};
}

/**
 * Fetches and registers all ability categories from WordPress.
 */
async function initializeCategories(): Promise< void > {
	try {
		const categories = await apiFetch< AbilityCategory[] >( {
			path: addQueryArgs( '/wp-abilities/v1/categories', {
				per_page: -1,
				context: 'edit',
			} ),
		} );

		if ( categories && Array.isArray( categories ) ) {
			for ( const category of categories ) {
				registerAbilityCategory( category.slug, {
					label: category.label,
					description: category.description,
					meta: {
						annotations: { serverRegistered: true },
					},
				} );
			}
		}
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error( 'Failed to fetch ability categories:', error );
	}
}

/**
 * Fetches and registers all abilities from WordPress.
 */
async function initializeAbilities(): Promise< void > {
	try {
		const abilities = await apiFetch< Ability[] >( {
			path: addQueryArgs( '/wp-abilities/v1/abilities', {
				per_page: -1,
				context: 'edit',
			} ),
		} );

		if ( abilities && Array.isArray( abilities ) ) {
			for ( const ability of abilities ) {
				// Register the ability with a callback
				// The abilities package filters annotations to allowed keys
				registerAbility( {
					...ability,
					callback: createServerCallback( ability ),
					meta: {
						annotations: {
							...ability.meta?.annotations,
							serverRegistered: true,
						},
					},
				} );
			}
		}
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error( 'Failed to fetch abilities:', error );
	}
}

/**
 * Initialize WordPress abilities integration.
 */
async function initialize(): Promise< void > {
	// Fetch and register categories, then abilities
	await initializeCategories();
	await initializeAbilities();
}

// Auto-initialize on import
initialize();
