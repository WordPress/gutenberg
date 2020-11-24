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

export default function SearchResults( { items, search, renderItem } ) {
	const templateInfos = useSelect(
		( select ) => {
			const { __experimentalGetTemplateInfo: getTemplateInfo } = select(
				'core/editor'
			);

			return items.map( ( item ) => ( {
				slug: item.slug,
				...getTemplateInfo( item ),
			} ) );
		},
		[ items ]
	);
	const itemsFiltered = useMemo( () => {
		if ( items === null || search.length === 0 ) {
			return [];
		}

		return items.filter( ( item ) => {
			const { title } = templateInfos.find(
				( { slug } ) => item.slug === slug
			);
			return normalizedSearch( title, search );
		} );
	}, [ items, search ] );

	const itemsRendered = useMemo( () => itemsFiltered.map( renderItem ), [
		itemsFiltered,
		renderItem,
	] );

	return (
		<NavigationGroup title={ __( 'Search results' ) }>
			{ itemsRendered }
		</NavigationGroup>
	);
}
