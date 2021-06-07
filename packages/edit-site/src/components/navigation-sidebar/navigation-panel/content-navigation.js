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
import {
	MENU_CONTENT_CATEGORIES,
	MENU_CONTENT_PAGES,
	MENU_CONTENT_POSTS,
} from './constants';
import { store as editSiteStore } from '../../../store';

export default function ContentNavigation( { onActivateMenu, skipAnimation } ) {
	const [ activeMenu, setActiveMenu ] = useState( 'root' );

	const page = useSelect(
		( select ) => select( editSiteStore ).getPage(),
		[]
	);

	const handleActivateMenu = ( menu ) => {
		setActiveMenu( menu );
		onActivateMenu( menu );
	};

	return (
		<Navigation
			activeItem={ page && `content-${ page.path }` }
			activeMenu={ activeMenu }
			onActivateMenu={ handleActivateMenu }
			skipAnimation={ skipAnimation }
		>
			<NavigationMenu title={ __( 'Content' ) }>
				<NavigationItem
					title={ __( 'Pages' ) }
					navigateToMenu={ MENU_CONTENT_PAGES }
				/>

				<NavigationItem
					title={ __( 'Categories' ) }
					navigateToMenu={ MENU_CONTENT_CATEGORIES }
				/>

				<NavigationItem
					title={ __( 'Posts' ) }
					navigateToMenu={ MENU_CONTENT_POSTS }
				/>
			</NavigationMenu>

			<ContentPagesMenu />
			<ContentCategoriesMenu />
			<ContentPostsMenu />
		</Navigation>
	);
}
