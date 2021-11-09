/**
 * External dependencies
 */
import { map, sortBy, keyBy } from 'lodash';

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
import { store as editorStore } from '@wordpress/editor';
import TemplateNavigationItem from './template-navigation-item';
import ContentNavigationItem from './content-navigation-item';

export default function SearchResults( { items, search, disableFilter } ) {
	let itemType = null;
	if ( items?.length > 0 ) {
		if ( items[ 0 ].taxonomy ) {
			itemType = 'taxonomy';
		} else {
			itemType = items[ 0 ].type;
		}
	}

	const itemInfos = useSelect(
		( select ) => {
			if ( itemType === null || items === null ) {
				return [];
			}

			if ( itemType === 'wp_template' ) {
				const {
					__experimentalGetTemplateInfo: getTemplateInfo,
				} = select( editorStore );

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
	const itemInfosMap = useMemo( () => keyBy( itemInfos, 'slug' ), [
		itemInfos,
	] );

	const itemsFiltered = useMemo( () => {
		if ( items === null || search.length === 0 ) {
			return [];
		}

		if ( disableFilter ) {
			return items;
		}

		return items.filter( ( { slug } ) => {
			const { title, description } = itemInfosMap[ slug ];

			return (
				normalizedSearch( slug, search ) ||
				normalizedSearch( title, search ) ||
				normalizedSearch( description, search )
			);
		} );
	}, [ items, itemInfos, search ] );

	const itemsSorted = useMemo( () => {
		if ( ! itemsFiltered ) {
			return [];
		}

		return sortBy( itemsFiltered, [
			( { slug } ) => {
				const { title } = itemInfosMap[ slug ];
				return ! normalizedSearch( title, search );
			},
		] );
	}, [ itemsFiltered, search ] );

	const ItemComponent =
		itemType === 'wp_template' || itemType === 'wp_template_part'
			? TemplateNavigationItem
			: ContentNavigationItem;

	return (
		<NavigationGroup title={ __( 'Search results' ) }>
			{ map( itemsSorted, ( item ) => (
				<ItemComponent
					item={ item }
					key={ `${ item.taxonomy || item.type }-${ item.id }` }
				/>
			) ) }
		</NavigationGroup>
	);
}
