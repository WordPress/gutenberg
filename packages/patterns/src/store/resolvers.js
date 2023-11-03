/**
 * WordPress dependencies
 */
import { decodeEntities } from '@wordpress/html-entities';
import apiFetch from '@wordpress/api-fetch';

export const getPatternCategories =
	() =>
	async ( { dispatch } ) => {
		const coreCategories = await apiFetch( {
			path: '/wp/v2/block-patterns/categories',
		} );
		const userCategories = await apiFetch( {
			path: '/wp/v2/wp_pattern_category',
		} );
		const mappedUserCategories =
			userCategories?.map( ( userCategory ) => ( {
				label: decodeEntities( userCategory.name ),
				name: userCategory.slug,
				id: userCategory.id,
				description: userCategory.description,
			} ) ) || [];
		const uniqueCategories = new Map();
		[ ...mappedUserCategories, ...coreCategories ].forEach(
			( category ) => {
				if (
					! uniqueCategories.has( category.label ) &&
					// There are two core categories with `Post` label so explicitly remove the one with
					// the `query` slug to avoid any confusion.
					category.name !== 'query'
				) {
					uniqueCategories.set( category.label, {
						label: category.label,
						name: category.name,
						description: category.description,
						id: category.id,
					} );
				}
			}
		);
		const patternCategories = Array.from( uniqueCategories.values() ).sort(
			( a, b ) => a.label.localeCompare( b.label )
		);
		dispatch( {
			type: 'RECEIVE_PATTERN_CATEGORIES',
			patternCategories,
		} );
	};
