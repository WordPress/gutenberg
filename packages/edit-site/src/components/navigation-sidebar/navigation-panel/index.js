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
} from '@wordpress/components';
import { store as coreDataStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import SiteMenu from './menus';
import MainDashboardButton from '../../main-dashboard-button';
import { store as editSiteStore } from '../../../store';
import { MENU_ROOT } from './constants';

const NavigationPanel = ( { isOpen } ) => {
	const {
		page: { context: { postType, postId } = {} } = {},
		editedPostId,
		editedPostType,
		activeMenu,
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
			activeMenu: getNavigationPanelActiveMenu(),
			siteTitle: siteData.name,
		};
	}, [] );

	const {
		setNavigationPanelActiveMenu: setActive,
		setIsNavigationPanelOpened,
	} = useDispatch( editSiteStore );

	let activeItem;
	if ( activeMenu !== MENU_ROOT ) {
		if ( activeMenu.startsWith( 'content' ) ) {
			activeItem = `${ postType }-${ postId }`;
		} else {
			activeItem = `${ editedPostType }-${ editedPostId }`;
		}
	}

	// Ensures focus is moved to the panel area when it is activated
	// from a separate component (such as document actions in the header).
	const panelRef = useRef();
	useEffect( () => {
		if ( isOpen ) {
			panelRef.current.focus();
		}
	}, [ activeMenu, isOpen ] );

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
						onActivateMenu={ setActive }
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
						<SiteMenu />
					</Navigation>
				</div>
			</div>
		</div>
	);
};

export default NavigationPanel;
