/**
 * WordPress dependencies
 */
import { sprintf } from '@wordpress/i18n';
import { resolveSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import type { Ability, AbilityCategory, AbilityCategoryArgs } from '../types';
import {
	RECEIVE_ABILITIES,
	REGISTER_ABILITY,
	UNREGISTER_ABILITY,
	RECEIVE_CATEGORIES,
	REGISTER_ABILITY_CATEGORY,
	UNREGISTER_ABILITY_CATEGORY,
	STORE_NAME,
} from './constants';

/**
 * Returns an action object used to receive abilities into the store.
 *
 * @param abilities Array of abilities to store.
 * @return Action object.
 */
export function receiveAbilities( abilities: Ability[] ) {
	return {
		type: RECEIVE_ABILITIES,
		abilities,
	};
}

/**
 * Returns an action object used to receive categories into the store.
 *
 * @param categories Array of categories to store.
 * @return Action object.
 */
export function receiveCategories( categories: AbilityCategory[] ) {
	return {
		type: RECEIVE_CATEGORIES,
		categories,
	};
}

/**
 * Registers an ability in the store.
 *
 * This action validates the ability before registration. If validation fails,
 * an error will be thrown. Categories will be automatically fetched from the
 * REST API if they haven't been loaded yet.
 *
 * @param  ability The ability to register.
 * @return Action object or function.
 * @throws {Error} If validation fails.
 */
export function registerAbility( ability: Ability ) {
	// @ts-expect-error - registry types are not yet available
	return async ( { select, dispatch } ) => {
		if ( ! ability.name ) {
			throw new Error( 'Ability name is required' );
		}

		// Validate name format matches server implementation
		if ( ! /^[a-z0-9-]+\/[a-z0-9-]+$/.test( ability.name ) ) {
			throw new Error(
				'Ability name must be a string containing a namespace prefix, i.e. "my-plugin/my-ability". It can only contain lowercase alphanumeric characters, dashes and the forward slash.'
			);
		}

		if ( ! ability.label ) {
			throw new Error(
				sprintf( 'Ability "%s" must have a label', ability.name )
			);
		}

		if ( ! ability.description ) {
			throw new Error(
				sprintf( 'Ability "%s" must have a description', ability.name )
			);
		}

		if ( ! ability.category ) {
			throw new Error(
				sprintf( 'Ability "%s" must have a category', ability.name )
			);
		}

		// Validate category format
		if ( ! /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test( ability.category ) ) {
			throw new Error(
				sprintf(
					'Ability "%1$s" has an invalid category. Category must be lowercase alphanumeric with dashes only Got: "%2$s"',
					ability.name,
					ability.category
				)
			);
		}

		// Ensure categories are loaded before validating
		const categories =
			await resolveSelect( STORE_NAME ).getAbilityCategories();
		const existingCategory = categories.find(
			( cat: AbilityCategory ) => cat.slug === ability.category
		);
		if ( ! existingCategory ) {
			throw new Error(
				sprintf(
					'Ability "%1$s" references non-existent category "%2$s". Please register the category first.',
					ability.name,
					ability.category
				)
			);
		}

		// Client-side abilities must have a callback
		if ( ability.callback && typeof ability.callback !== 'function' ) {
			throw new Error(
				sprintf(
					'Ability "%s" has an invalid callback. Callback must be a function',
					ability.name
				)
			);
		}

		// Check if ability is already registered
		const existingAbility = select.getAbility( ability.name );
		if ( existingAbility ) {
			throw new Error(
				sprintf( 'Ability "%s" is already registered', ability.name )
			);
		}

		// All validation passed, dispatch the registration action
		dispatch( {
			type: REGISTER_ABILITY,
			ability,
		} );
	};
}

/**
 * Returns an action object used to unregister a client-side ability.
 *
 * @param name The name of the ability to unregister.
 * @return Action object.
 */
export function unregisterAbility( name: string ) {
	return {
		type: UNREGISTER_ABILITY,
		name,
	};
}

/**
 * Registers a client-side ability category in the store.
 *
 * This action validates the category before registration. If validation fails,
 * an error will be thrown. Categories will be automatically fetched from the
 * REST API if they haven't been loaded yet to check for duplicates.
 *
 * @param  slug The unique category slug identifier.
 * @param  args Category arguments (label, description, optional meta).
 * @return Action object or function.
 * @throws {Error} If validation fails.
 */
export function registerAbilityCategory(
	slug: string,
	args: AbilityCategoryArgs
) {
	// @ts-expect-error - registry types are not yet available
	return async ( { select, dispatch } ) => {
		if ( ! slug ) {
			throw new Error( 'Category slug is required' );
		}

		// Validate slug format matches server implementation
		if ( ! /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test( slug ) ) {
			throw new Error(
				'Category slug must contain only lowercase alphanumeric characters and dashes.'
			);
		}

		// Ensure categories are loaded before checking for duplicates
		await resolveSelect( STORE_NAME ).getAbilityCategories();
		const existingCategory = select.getAbilityCategory( slug );
		if ( existingCategory ) {
			throw new Error(
				sprintf( 'Category "%s" is already registered.', slug )
			);
		}

		// Validate label presence and type (matches PHP empty() + is_string())
		if ( ! args.label || typeof args.label !== 'string' ) {
			throw new Error(
				'The category properties must contain a `label` string.'
			);
		}

		// Validate description presence and type (matches PHP empty() + is_string())
		if ( ! args.description || typeof args.description !== 'string' ) {
			throw new Error(
				'The category properties must contain a `description` string.'
			);
		}

		if (
			args.meta !== undefined &&
			( typeof args.meta !== 'object' || Array.isArray( args.meta ) )
		) {
			throw new Error(
				'The category properties should provide a valid `meta` object.'
			);
		}

		const category: AbilityCategory = {
			slug,
			label: args.label,
			description: args.description,
			meta: {
				...( args.meta || {} ),
				// Internal implementation note: Client-registered categories will have `meta._clientRegistered` set to `true` to differentiate them from server-fetched categories.
				// This is used internally by the resolver to determine whether to fetch categories from the server.
				_clientRegistered: true,
			},
		};

		dispatch( {
			type: REGISTER_ABILITY_CATEGORY,
			category,
		} );
	};
}

/**
 * Returns an action object used to unregister a client-side ability category.
 *
 * @param slug The slug of the category to unregister.
 * @return Action object.
 */
export function unregisterAbilityCategory( slug: string ) {
	return {
		type: UNREGISTER_ABILITY_CATEGORY,
		slug,
	};
}
