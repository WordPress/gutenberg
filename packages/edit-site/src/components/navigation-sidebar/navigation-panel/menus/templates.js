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
import { SearchResults } from '../search-results';
import { useDebouncedSearch } from '../use-debounced-search';

export default function TemplatesMenu() {
	const {
		search,
		debouncing,
		menuProps: searchMenuProps,
	} = useDebouncedSearch();

	const templates = useSelect(
		( select ) =>
			select( 'core' ).getEntityRecords( 'postType', 'wp_template', {
				status: [ 'publish', 'auto-draft' ],
				per_page: -1,
				search,
			} ),
		[ search ]
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
			{ ...searchMenuProps }
		>
			{ search && (
				<SearchResults items={ templates } debouncing={ debouncing }>
					{ map( templates, ( template ) => (
						<TemplateNavigationItem
							item={ template }
							key={ `wp_template-${ template.id }` }
						/>
					) ) }
				</SearchResults>
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
					/>
					<NavigationItem
						navigateToMenu={ MENU_TEMPLATES_POSTS }
						title={ __( 'Posts' ) }
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
				<NavigationItem title={ __( 'Loading…' ) } />
			) }

			<TemplatesPostsMenu templates={ templates } />
			<TemplatesPagesMenu templates={ templates } />
			<TemplatesAllMenu templates={ templates } />
		</NavigationMenu>
	);
}
