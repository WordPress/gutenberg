/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { __experimentalNavigationGroup as NavigationGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { normalizedSearch } from './utils';
import { useSelect } from '@wordpress/data';
import TemplateNavigationItem from './template-navigation-item';
import ContentNavigationItem from './content-navigation-item';

export default function SearchResults( { items, search } ) {
	let itemType = null;
	if ( items.length > 0 ) {
		if ( items[ 0 ].taxonomy ) {
			itemType = 'taxonomy';
		} else {
			itemType = items[ 0 ].type;
		}
	}

	const itemInfos = useSelect(
		( select ) => {
			if ( itemType === 'wp_template' ) {
				const {
					__experimentalGetTemplateInfo: getTemplateInfo,
				} = select( 'core/editor' );

				return items.map( ( item ) => ( {
					slug: item.slug,
					...getTemplateInfo( item ),
				} ) );
			}

			if ( itemType === 'taxonomy' ) {
				return items.map( ( item ) => ( {
					slug: item.slug,
					title: item.name,
					description: item.description,
				} ) );
			}

			return items.map( ( item ) => ( {
				slug: item.slug,
				title: item.title?.rendered,
				description: item.excerpt?.rendered,
			} ) );
		},
		[ items, itemType ]
	);

	const itemsFiltered = useMemo( () => {
		if ( items === null || search.length === 0 ) {
			return [];
		}

		return items.filter( ( { slug } ) => {
			const { title, description } = itemInfos.find(
				( info ) => info.slug === slug
			);

			return (
				normalizedSearch( slug, search ) ||
				normalizedSearch( title, search ) ||
				normalizedSearch( description, search )
			);
		} );
	}, [ items, itemInfos, search ] );

	const ItemComponent =
		itemType === 'wp_template' || itemType === 'wp_template_part'
			? TemplateNavigationItem
			: ContentNavigationItem;

	return (
		<NavigationGroup title={ __( 'Search results' ) }>
			{ map( itemsFiltered, ( item ) => (
				<ItemComponent
					item={ item }
					key={ `${ item.taxonomy || item.type }-${ item.id }` }
				/>
			) ) }
		</NavigationGroup>
	);
}
