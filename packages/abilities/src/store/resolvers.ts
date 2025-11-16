/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import type { Ability, AbilityCategory } from '../types';
import { ENTITY_KIND, ENTITY_NAME, ENTITY_NAME_CATEGORIES } from './constants';
import {
	receiveAbilities,
	receiveCategories,
	registerAbility,
	registerAbilityCategory,
} from './actions';

/**
 * Resolver for getAbilities selector.
 * Fetches all abilities from the server.
 *
 * The resolver only fetches once (without query args filter) and stores all abilities.
 * Query args filtering handled client-side by the selector for better performance
 * and to avoid multiple API requests when filtering by different categories.
 */
export function getAbilities() {
	// @ts-expect-error - registry types are not yet available
	return async ( { dispatch, registry, select } ) => {
		const existingAbilities = select.getAbilities();

		// Check if we have any server-side abilities (abilities without callbacks)
		// Client abilities have callbacks and are registered immediately on page load
		// We only want to skip fetching if we've already fetched server abilities
		const hasServerAbilities = existingAbilities.some(
			( ability: Ability ) => ! ability.callback
		);

		if ( hasServerAbilities ) {
			return;
		}

		const abilities = await registry
			.resolveSelect( coreStore )
			.getEntityRecords( ENTITY_KIND, ENTITY_NAME, {
				per_page: -1,
			} );

		dispatch( receiveAbilities( abilities || [] ) );
	};
}

/**
 * Resolver for getAbility selector.
 * Fetches a specific ability from the server if not already in store.
 *
 * @param name Ability name.
 */
export function getAbility( name: string ) {
	// @ts-expect-error - registry types are not yet available
	return async ( { dispatch, registry, select } ) => {
		// Check if ability already exists in store (i.e. client ability or already fetched)
		const existingAbility = select.getAbility( name );
		if ( existingAbility ) {
			return;
		}

		try {
			const ability = await registry
				.resolveSelect( coreStore )
				.getEntityRecord( ENTITY_KIND, ENTITY_NAME, name );

			if ( ability ) {
				await dispatch( registerAbility( ability ) );
			}
		} catch ( error ) {
			// If ability doesn't exist or error, we'll return undefined from the selector
			// eslint-disable-next-line no-console
			console.debug( `Ability not found: ${ name }` );
		}
	};
}

/**
 * Resolver for getAbilityCategories selector.
 * Fetches all categories from the server.
 *
 * The resolver only fetches once and stores all categories.
 */
export function getAbilityCategories() {
	// @ts-expect-error - registry types are not yet available
	return async ( { dispatch, registry, select } ) => {
		const existingCategories = select.getAbilityCategories();

		// Check if we have any server-side categories (categories without meta._clientRegistered flag)
		// Client categories have meta._clientRegistered=true and might be registered immediately
		// We only want to skip fetching if we've already fetched server categories
		const hasServerCategories = existingCategories.some(
			( category: AbilityCategory ) => ! category.meta?._clientRegistered
		);

		if ( hasServerCategories ) {
			return;
		}

		const categories = await registry
			.resolveSelect( coreStore )
			.getEntityRecords( ENTITY_KIND, ENTITY_NAME_CATEGORIES, {
				per_page: -1,
			} );

		dispatch( receiveCategories( categories || [] ) );
	};
}

/**
 * Resolver for getAbilityCategory selector.
 * Fetches a specific category from the server if not already in store.
 *
 * @param slug Category slug.
 */
export function getAbilityCategory( slug: string ) {
	// @ts-expect-error - registry types are not yet available
	return async ( { dispatch, registry, select } ) => {
		// Check if category already exists in store (either client-registered or server-fetched).
		// This prevents unnecessary network requests while allowing client-side categories
		// to be retrieved immediately without hitting the API.
		const existingCategory = select.getAbilityCategory( slug );
		if ( existingCategory ) {
			return;
		}

		try {
			const category = await registry
				.resolveSelect( coreStore )
				.getEntityRecord( ENTITY_KIND, ENTITY_NAME_CATEGORIES, slug );

			if ( category ) {
				await dispatch(
					registerAbilityCategory( category.slug, {
						label: category.label,
						description: category.description,
						meta: category.meta,
					} )
				);
			}
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.debug( `Category not found: ${ slug }` );
		}
	};
}
