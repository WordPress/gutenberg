/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalNavigation as Navigation,
	__experimentalNavigationBackButton as NavigationBackButton,
	__experimentalNavigationGroup as NavigationGroup,
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationMenu as NavigationMenu,
} from '@wordpress/components';
import { usePrevious } from '@wordpress/compose';
import { store as coreDataStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import ContentPagesMenu from './menus/content-pages';
import ContentCategoriesMenu from './menus/content-categories';
import ContentPostsMenu from './menus/content-posts';
import TemplatesMenu from './menus/templates';
import TemplatePartsMenu from './menus/template-parts';
import MainDashboardButton from '../../main-dashboard-button';
import { store as editSiteStore } from '../../../store';
import {
	MENU_ROOT,
	MENU_TEMPLATE_PARTS,
	MENU_TEMPLATES,
	MENU_CONTENT_CATEGORIES,
	MENU_CONTENT_PAGES,
	MENU_CONTENT_POSTS,
} from './constants';

const NavigationPanel = ( { isOpen } ) => {
	const [ contentActiveMenu, setContentActiveMenu ] = useState( MENU_ROOT );
	const {
		page: { context: { postType, postId } = {} } = {},
		editedPostId,
		editedPostType,
		templatesActiveMenu,
		siteTitle,
	} = useSelect( ( select ) => {
		const {
			getEditedPostType,
			getEditedPostId,
			getNavigationPanelActiveMenu,
			getPage,
		} = select( editSiteStore );
		const { getEntityRecord } = select( coreDataStore );

		const siteData =
			getEntityRecord( 'root', '__unstableBase', undefined ) || {};

		return {
			page: getPage(),
			editedPostId: getEditedPostId(),
			editedPostType: getEditedPostType(),
			templatesActiveMenu: getNavigationPanelActiveMenu(),
			siteTitle: siteData.name,
		};
	}, [] );

	const { setNavigationPanelActiveMenu } = useDispatch( editSiteStore );

	const isTemplateActiveRoot = templatesActiveMenu === MENU_ROOT;
	const isContentActiveRoot = contentActiveMenu === MENU_ROOT;
	let activeMenu;
	let activeItem;
	if ( isTemplateActiveRoot && isContentActiveRoot ) {
		activeMenu = MENU_ROOT;
	} else {
		[ activeMenu, activeItem ] = isTemplateActiveRoot
			? [ contentActiveMenu, `${ postType }-${ postId }` ]
			: [ templatesActiveMenu, `${ editedPostType }-${ editedPostId }` ];
	}

	// Ensures focus is moved to the panel area when it is activated
	// from a separate component (such as document actions in the header).
	const panelRef = useRef();
	useEffect( () => {
		if ( isOpen ) {
			panelRef.current.focus();
		}
	}, [ templatesActiveMenu ] );

	// Resets the content menu to its root whenever the navigation opens to avoid
	// having it stuck on a sub-menu, interfering with the normal navigation behavior.
	const prevIsOpen = usePrevious( isOpen );
	useEffect( () => {
		if ( contentActiveMenu !== MENU_ROOT && isOpen && ! prevIsOpen ) {
			setContentActiveMenu( MENU_ROOT );
		}
	}, [ contentActiveMenu, isOpen ] );

	const { setIsNavigationPanelOpened } = useDispatch( editSiteStore );

	const closeOnEscape = ( event ) => {
		if ( event.keyCode === ESCAPE ) {
			event.stopPropagation();
			setIsNavigationPanelOpened( false );
		}
	};

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className={ classnames( `edit-site-navigation-panel`, {
				'is-open': isOpen,
			} ) }
			ref={ panelRef }
			tabIndex="-1"
			onKeyDown={ closeOnEscape }
		>
			<div className="edit-site-navigation-panel__inner">
				<div className="edit-site-navigation-panel__site-title-container">
					<div className="edit-site-navigation-panel__site-title">
						{ siteTitle }
					</div>
				</div>

				<div className="edit-site-navigation-panel__scroll-container">
					<Navigation
						activeItem={ activeItem }
						activeMenu={ activeMenu }
						onActivateMenu={ ( menu ) => {
							if ( menu === MENU_ROOT ) {
								setNavigationPanelActiveMenu( menu );
								setContentActiveMenu( menu );
							} else if ( menu.startsWith( MENU_TEMPLATES ) ) {
								setNavigationPanelActiveMenu( menu );
							} else {
								setContentActiveMenu( menu );
							}
						} }
					>
						{ activeMenu === MENU_ROOT && (
							<MainDashboardButton.Slot>
								<NavigationBackButton
									backButtonLabel={ __( 'Dashboard' ) }
									className="edit-site-navigation-panel__back-to-dashboard"
									href="index.php"
								/>
							</MainDashboardButton.Slot>
						) }

						<NavigationMenu>
							<NavigationGroup title={ __( 'Theme' ) }>
								<NavigationItem
									title={ __( 'Templates' ) }
									navigateToMenu={ MENU_TEMPLATES }
								/>
								<NavigationItem
									title={ __( 'Template Parts' ) }
									navigateToMenu={ MENU_TEMPLATE_PARTS }
								/>
							</NavigationGroup>

							<NavigationGroup title={ __( 'Content' ) }>
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
							</NavigationGroup>
						</NavigationMenu>

						<TemplatesMenu />
						<TemplatePartsMenu />

						<ContentPagesMenu />
						<ContentCategoriesMenu />
						<ContentPostsMenu />
					</Navigation>
				</div>
			</div>
		</div>
	);
};

export default NavigationPanel;
