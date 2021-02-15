/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	category as categoryIcon,
	page as pageIcon,
	postTitle as postIcon,
	tag as tagIcon,
} from '@wordpress/icons';

import apiFetch from '@wordpress/api-fetch';
import { registerBlockVariation } from '@wordpress/blocks';

const variations = [
	{
		name: 'link',
		isDefault: true,
		title: __( 'Link' ),
		description: __( 'A link to a URL.' ),
		attributes: {},
	},
];

/**
 * Add `isActive` function to all `navigation link` variations, if not defined.
 * `isActive` function is used to find a variation match from a created
 *  Block by providing its attributes.
 */
variations.forEach( ( variation ) => {
	if ( variation.isActive ) return;
	variation.isActive = ( blockAttributes, variationAttributes ) =>
		blockAttributes.type === variationAttributes.type;
} );

const ICON_MAP = {
	post: postIcon,
	page: pageIcon,
	tag: tagIcon,
	category: categoryIcon,
};

Promise.all( [
	apiFetch( {
		path: '/wp/v2/types?context=edit&per_page=-1&show_in_nav_menus=true',
		type: 'GET',
	} ),
	apiFetch( {
		path:
			'/wp/v2/taxonomies?context=edit&per_page=-1&show_in_nav_menus=true',
		type: 'GET',
	} ),
] ).then( function ( [ postTypes, taxonomies ] ) {
	const postTypeKeys = Object.keys( postTypes );
	for ( const type of postTypeKeys ) {
		const postType = postTypes[ type ];
		//customizer actually sets type = 'post-type', and 'object' = $post_type->name
		registerBlockVariation( 'core/navigation-link', {
			name: postType.slug, //TODO: can this be trusted to be unique?
			attributes: { type: postType.slug, objectType: 'post-type' },
			title: postType?.labels?.menu_name, //TODO: should this be passed through as a new type.label for description
			...( ICON_MAP[ postType.slug ] && {
				icon: ICON_MAP[ postType.slug ],
			} ), //TODO: what about custom post type/taxonomy icons?
		} );
	}
	const taxonomyKeys = Object.keys( taxonomies );
	for ( const taxonomyKey of taxonomyKeys ) {
		//customizer actually sets type = 'taxonomy', and 'object' = $taxonomy->name
		//it also has a custom hook for: $item_types = apply_filters( 'customize_nav_menu_available_item_types', $item_types );
		//TODO needs research for data structure choices, we likely need taxonomy|post_type and name, or term/post_type id
		const taxonomy = taxonomies[ taxonomyKey ];
		//tag is post_tag
		if ( taxonomyKey === 'post_tag' ) {
			registerBlockVariation( 'core/navigation-link', {
				name: 'tag',
				attributes: { type: 'tag', objectType: 'taxonomy' },
				title: taxonomy?.labels?.menu_name,
				icon: ICON_MAP.tag,
			} );
		} else {
			registerBlockVariation( 'core/navigation-link', {
				name: taxonomy.slug, //TODO: can this be trusted to be unique?
				attributes: {
					type: taxonomy.slug,
					objectType: 'taxonomy',
				},
				title: taxonomy?.labels?.menu_name,
				...( ICON_MAP[ taxonomy.slug ] && {
					icon: ICON_MAP[ taxonomy.slug ],
				} ),
			} );
		}
	}
} );

export default variations;
