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
import { __ } from '@wordpress/i18n';
//import { ESCAPE } from '@wordpress/keycodes';
import { decodeEntities } from '@wordpress/html-entities';
import {
	home as siteIcon,
	layout as templateIcon,
	symbolFilled as templatePartIcon,
	wordpress,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useLink } from '../../routes/link';
import MainDashboardButton from '../../main-dashboard-button';
import { store as editSiteStore } from '../../../store';
import DefaultSidebar from '../../sidebar/default-sidebar';

const SITE_EDITOR_KEY = 'site-editor';

function NavLink( { params, replace, ...props } ) {
	const linkProps = useLink( params, replace );

	return <NavigationItem { ...linkProps } { ...props } />;
}

const NavigationPanel = ( { activeItem = SITE_EDITOR_KEY } ) => {
	const { homeTemplate, siteTitle } = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreDataStore );
		const { getSettings, isNavigationOpened } = select( editSiteStore );

		const siteData =
			getEntityRecord( 'root', '__unstableBase', undefined ) || {};

		return {
			siteTitle: siteData.name,
			homeTemplate: getSettings().__unstableHomeTemplate,
			isNavigationOpen: isNavigationOpened(),
		};
	}, [] );
	//const { setIsNavigationPanelOpened } = useDispatch( editSiteStore );

	/*const closeOnEscape = ( event ) => {
		if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
			event.preventDefault();
			setIsNavigationPanelOpened( false );
		}
	};*/
	return (
		<DefaultSidebar
			className="edit-site-navigation-panel"
			scope="core/edit-global"
			identifier="edit-global/navigation-panel"
			title={ decodeEntities( siteTitle ) }
			icon={ wordpress }
			iconSize={ 36 }
			closeLabel={ __( 'Close edit site sidebar' ) }
			panelClassName="edit-site-navigation-panel__panel"
			header={ decodeEntities( siteTitle ) }
		>
			<div
				className="edit-site-navigation-panel"
				// eslint-disable-next-line jsx-a11y/no-static-element-interactions
				//onKeyDown={ closeOnEscape }
			>
				<div className="edit-site-navigation-panel__inner">
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
											postId: homeTemplate?.postId,
											postType: homeTemplate?.postType,
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
		</DefaultSidebar>
	);
};

export default NavigationPanel;
