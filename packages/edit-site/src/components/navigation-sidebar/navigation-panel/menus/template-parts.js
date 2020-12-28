/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import {
	__experimentalNavigationMenu as NavigationMenu,
	__experimentalNavigationItem as NavigationItem,
} from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TemplateNavigationItem from '../template-navigation-item';
import { MENU_ROOT, MENU_TEMPLATE_PARTS } from '../constants';
import SearchResults from '../search-results';

export default function TemplatePartsMenu() {
	const [ search, setSearch ] = useState( '' );
	const onSearch = useCallback( ( value ) => {
		setSearch( value );
	} );

	const templateParts = useSelect( ( select ) => {
		const unfilteredTemplateParts =
			select( 'core' ).getEntityRecords(
				'postType',
				'wp_template_part'
			) || [];
		const currentTheme = select( 'core' ).getCurrentTheme()?.stylesheet;
		return unfilteredTemplateParts.filter(
			( item ) =>
				item.status === 'publish' || item.wp_theme_slug === currentTheme
		);
	}, [] );

	return (
		<NavigationMenu
			menu={ MENU_TEMPLATE_PARTS }
			title={ __( 'Template Parts' ) }
			parentMenu={ MENU_ROOT }
			hasSearch={ true }
			onSearch={ onSearch }
			search={ search }
		>
			{ search && (
				<SearchResults items={ templateParts } search={ search } />
			) }

			{ ! search &&
				map( templateParts, ( templatePart ) => (
					<TemplateNavigationItem
						item={ templatePart }
						key={ `wp_template_part-${ templatePart.id }` }
					/>
				) ) }

			{ ! search && templateParts === null && (
				<NavigationItem title={ __( 'Loading…' ) } isText />
			) }
		</NavigationMenu>
	);
}
