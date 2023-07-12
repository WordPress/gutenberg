/**
 * WordPress dependencies
 */
import { postCategories, postTerms } from '@wordpress/icons';
import { select, subscribe } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { registerBlockVariation } from '@wordpress/blocks';

const variationIconMap = {
	category: postCategories,
	post_tag: postTerms,
};

// Creates dynamic variations for all public queryable taxonomies
// Do this in the editor, and not when registering block on server so all registered taxonomies can be fetched
export default function createVariations() {
	const unsubscribe = subscribe( () => {
		const taxonomies = select( coreStore ).getTaxonomies( {
			// TODO: Maybe fetch only taxonomies connected to current post type (see #52569)
			// type: postType,
			per_page: -1,
			context: 'edit',
		} );

		if ( ! taxonomies ) {
			return;
		}
		unsubscribe();

		taxonomies.forEach( ( taxonomy ) => {
			if ( ! taxonomy.visibility?.publicly_queryable ) {
				return;
			}
			const variation = {
				name: taxonomy.slug,
				title: taxonomy.name,
				// We add `icons` to categories and tags. The remaining ones use
				// the block's default icon.
				icon: variationIconMap[ taxonomy.slug ] ?? postCategories,
				description: sprintf(
					/* translators: %s: taxonomy's label */
					__( 'Display the assigned taxonomy: %s' ),
					taxonomy.name
				),
				attributes: {
					term: taxonomy.slug,
				},
				isActive: [ 'term' ],
				scope: [ 'inserter', 'transform' ],
			};

			registerBlockVariation( 'core/post-terms', variation );
		} );
	} );
}
