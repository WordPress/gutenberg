/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	__experimentalNavigation as Navigation,
	__experimentalNavigationMenu as NavigationMenu,
	__experimentalNavigationItem as NavigationItem,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ContentPagesMenu from './menus/content-pages';
import ContentCategoriesMenu from './menus/content-categories';
import ContentPostsMenu from './menus/content-posts';

export default function ContentNavigation() {
	const [ activeMenu, setActiveMenu ] = useState( 'root' );

	const page = useSelect(
		( select ) => select( 'core/edit-site' ).getPage(),
		[]
	);

	return (
		<Navigation
			activeItem={ `content-${ page.path }` }
			activeMenu={ activeMenu }
			onActivateMenu={ setActiveMenu }
		>
			<NavigationMenu title={ __( 'Content' ) }>
				<NavigationItem
					title={ __( 'Pages' ) }
					navigateToMenu="content-pages"
				/>

				<NavigationItem
					title={ __( 'Categories' ) }
					navigateToMenu="content-categories"
				/>

				<NavigationItem
					title={ __( 'Posts' ) }
					navigateToMenu="content-posts"
				/>
			</NavigationMenu>

			<ContentPagesMenu />
			<ContentCategoriesMenu />
			<ContentPostsMenu />
		</Navigation>
	);
}
