/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationMenu as NavigationMenu,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TemplatesPagesMenu from './templates-pages';
import TemplatesPostsMenu from './templates-posts';
import {
	MENU_ROOT,
	MENU_TEMPLATES,
	MENU_TEMPLATES_ALL,
	MENU_TEMPLATES_PAGES,
	MENU_TEMPLATES_POSTS,
	TEMPLATES_GENERAL,
} from '../constants';
import TemplatesAllMenu from './templates-all';
import NewTemplateDropdown from '../new-template-dropdown';
import TemplateNavigationItem from '../template-navigation-item';
import SearchResults from '../search-results';

export default function TemplatesMenu() {
	const [ search, setSearch ] = useState( '' );
	const onSearch = useCallback( ( value ) => {
		setSearch( value );
	} );

	const templates = useSelect(
		( select ) =>
			select( 'core' ).getEntityRecords( 'postType', 'wp_template' ),
		[]
	);

	const generalTemplates = templates?.filter( ( { slug } ) =>
		TEMPLATES_GENERAL.includes( slug )
	);

	return (
		<NavigationMenu
			menu={ MENU_TEMPLATES }
			title={ __( 'Templates' ) }
			titleAction={ <NewTemplateDropdown /> }
			parentMenu={ MENU_ROOT }
			hasSearch={ true }
			onSearch={ onSearch }
			search={ search }
		>
			{ search && (
				<SearchResults items={ templates } search={ search } />
			) }

			{ ! search && (
				<>
					<NavigationItem
						navigateToMenu={ MENU_TEMPLATES_ALL }
						title={ _x( 'All', 'all templates' ) }
					/>
					<NavigationItem
						navigateToMenu={ MENU_TEMPLATES_PAGES }
						title={ __( 'Pages' ) }
						hideIfTargetMenuEmpty
					/>
					<NavigationItem
						navigateToMenu={ MENU_TEMPLATES_POSTS }
						title={ __( 'Posts' ) }
						hideIfTargetMenuEmpty
					/>
					{ map( generalTemplates, ( template ) => (
						<TemplateNavigationItem
							item={ template }
							key={ `wp_template-${ template.id }` }
						/>
					) ) }
				</>
			) }

			{ ! search && templates === null && (
				<NavigationItem title={ __( 'Loading…' ) } isText />
			) }

			<TemplatesPostsMenu templates={ templates } />
			<TemplatesPagesMenu templates={ templates } />
			<TemplatesAllMenu templates={ templates } />
		</NavigationMenu>
	);
}
