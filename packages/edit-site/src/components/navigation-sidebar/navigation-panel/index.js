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
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { ESCAPE } from '@wordpress/keycodes';
import { decodeEntities } from '@wordpress/html-entities';
import {
	home as siteIcon,
	layout as templateIcon,
	symbolFilled as templatePartIcon,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useLink } from '../../routes/link';
import MainDashboardButton from '../../main-dashboard-button';
import { store as editSiteStore } from '../../../store';

const SITE_EDITOR_KEY = 'site-editor';

function NavLink( { params, replace, ...props } ) {
	const linkProps = useLink( params, replace );

	return <NavigationItem { ...linkProps } { ...props } />;
}

const NavigationPanel = ( { activeItem = SITE_EDITOR_KEY } ) => {
	const { isNavigationOpen, siteTitle } = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreDataStore );

		const siteData =
			getEntityRecord( 'root', '__unstableBase', undefined ) || {};

		return {
			siteTitle: siteData.name,
			isNavigationOpen: select( editSiteStore ).isNavigationOpened(),
		};
	}, [] );
	const { setIsNavigationPanelOpened } = useDispatch( editSiteStore );

	const closeOnEscape = ( event ) => {
		if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
			event.preventDefault();
			setIsNavigationPanelOpened( false );
		}
	};

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className={ classnames( `edit-site-navigation-panel`, {
				'is-open': isNavigationOpen,
			} ) }
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
								<NavLink
									icon={ siteIcon }
									title={ __( 'Site' ) }
									item={ SITE_EDITOR_KEY }
									params={ {
										postId: undefined,
										postType: undefined,
									} }
								/>
								<NavLink
									icon={ templateIcon }
									title={ __( 'Templates' ) }
									item="wp_template"
									params={ {
										postId: undefined,
										postType: 'wp_template',
									} }
								/>
								<NavLink
									icon={ templatePartIcon }
									title={ __( 'Template Parts' ) }
									item="wp_template_part"
									params={ {
										postId: undefined,
										postType: 'wp_template_part',
									} }
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
