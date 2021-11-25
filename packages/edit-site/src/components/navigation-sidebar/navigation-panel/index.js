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
import { store as coreDataStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ESCAPE } from '@wordpress/keycodes';
import { decodeEntities } from '@wordpress/html-entities';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import MainDashboardButton from '../../main-dashboard-button';

const SITE_EDITOR_KEY = 'site-editor';

const NavigationPanel = ( {
	isOpen,
	setIsOpen,
	activeItem = SITE_EDITOR_KEY,
} ) => {
	const siteTitle = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreDataStore );

		const siteData =
			getEntityRecord( 'root', '__unstableBase', undefined ) || {};

		return siteData.name;
	}, [] );

	// Ensures focus is moved to the panel area when it is activated
	// from a separate component (such as document actions in the header).
	const panelRef = useRef();
	useEffect( () => {
		if ( isOpen ) {
			panelRef.current.focus();
		}
	}, [ activeItem, isOpen ] );

	const closeOnEscape = ( event ) => {
		if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
			event.preventDefault();
			setIsOpen( false );
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
						{ decodeEntities( siteTitle ) }
					</div>
				</div>
				<div className="edit-site-navigation-panel__scroll-container">
					<Navigation activeItem={ activeItem }>
						<MainDashboardButton.Slot>
							<NavigationBackButton
								backButtonLabel={ __( 'Dashboard' ) }
								className="edit-site-navigation-panel__back-to-dashboard"
								href="index.php"
							/>
						</MainDashboardButton.Slot>

						<NavigationMenu>
							<NavigationGroup title={ __( 'Editor' ) }>
								<NavigationItem
									title={ __( 'Site' ) }
									item={ SITE_EDITOR_KEY }
									href={ addQueryArgs( window.location.href, {
										postId: undefined,
										postType: undefined,
									} ) }
								/>
								<NavigationItem
									title={ __( 'Templates' ) }
									item="wp_template"
									href={ addQueryArgs( window.location.href, {
										postId: undefined,
										postType: 'wp_template',
									} ) }
								/>
								<NavigationItem
									title={ __( 'Template Parts' ) }
									item="wp_template_part"
									href={ addQueryArgs( window.location.href, {
										postId: undefined,
										postType: 'wp_template_part',
									} ) }
								/>
							</NavigationGroup>
						</NavigationMenu>
					</Navigation>
				</div>
			</div>
		</div>
	);
};

export default NavigationPanel;
