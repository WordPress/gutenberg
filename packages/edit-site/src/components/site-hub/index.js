/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	__experimentalHStack as HStack,
	VisuallyHidden,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { memo, forwardRef, useContext } from '@wordpress/element';
import { search } from '@wordpress/icons';
import { store as commandsStore } from '@wordpress/commands';
import { displayShortcut } from '@wordpress/keycodes';
import { filterURLForDisplay } from '@wordpress/url';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import SiteIcon from '../site-icon';
import { unlock } from '../../lock-unlock';
const { useHistory } = unlock( routerPrivateApis );
import { SidebarNavigationContext } from '../sidebar';

const SiteHub = memo(
	forwardRef( ( { isTransparent }, ref ) => {
		const { dashboardLink, homeUrl, siteTitle } = useSelect( ( select ) => {
			const { getSettings } = unlock( select( editSiteStore ) );

			const {
				getSite,
				getUnstableBase, // Site index.
			} = select( coreStore );
			const _site = getSite();
			return {
				dashboardLink:
					getSettings().__experimentalDashboardLink || 'index.php',
				homeUrl: getUnstableBase()?.home,
				siteTitle:
					! _site?.title && !! _site?.url
						? filterURLForDisplay( _site?.url )
						: _site?.title,
			};
		}, [] );
		const { open: openCommandCenter } = useDispatch( commandsStore );

		return (
			<div className="edit-site-site-hub">
				<HStack justify="flex-start" spacing="0">
					<div
						className={ clsx(
							'edit-site-site-hub__view-mode-toggle-container',
							{
								'has-transparent-background': isTransparent,
							}
						) }
					>
						<Button
							ref={ ref }
							href={ dashboardLink }
							label={ __( 'Go to the Dashboard' ) }
							className="edit-site-layout__view-mode-toggle"
							style={ {
								transform: 'scale(0.5)',
								borderRadius: 4,
							} }
						>
							<SiteIcon className="edit-site-layout__view-mode-toggle-icon" />
						</Button>
					</div>

					<HStack>
						<div className="edit-site-site-hub__title">
							<Button
								variant="link"
								href={ homeUrl }
								target="_blank"
							>
								{ decodeEntities( siteTitle ) }
								<VisuallyHidden as="span">
									{
										/* translators: accessibility text */
										__( '(opens in a new tab)' )
									}
								</VisuallyHidden>
							</Button>
						</div>
						<HStack
							spacing={ 0 }
							expanded={ false }
							className="edit-site-site-hub__actions"
						>
							<Button
								className="edit-site-site-hub_toggle-command-center"
								icon={ search }
								onClick={ () => openCommandCenter() }
								label={ __( 'Open command palette' ) }
								shortcut={ displayShortcut.primary( 'k' ) }
							/>
						</HStack>
					</HStack>
				</HStack>
			</div>
		);
	} )
);

export default SiteHub;

export const SiteHubMobile = memo(
	forwardRef( ( { isTransparent }, ref ) => {
		const history = useHistory();
		const { navigate } = useContext( SidebarNavigationContext );

		const { homeUrl, siteTitle } = useSelect( ( select ) => {
			const {
				getSite,
				getUnstableBase, // Site index.
			} = select( coreStore );
			const _site = getSite();
			return {
				homeUrl: getUnstableBase()?.home,
				siteTitle:
					! _site?.title && !! _site?.url
						? filterURLForDisplay( _site?.url )
						: _site?.title,
			};
		}, [] );
		const { open: openCommandCenter } = useDispatch( commandsStore );

		return (
			<div className="edit-site-site-hub">
				<HStack justify="flex-start" spacing="0">
					<div
						className={ clsx(
							'edit-site-site-hub__view-mode-toggle-container',
							{
								'has-transparent-background': isTransparent,
							}
						) }
					>
						<Button
							ref={ ref }
							label={ __( 'Go to Site Editor' ) }
							className="edit-site-layout__view-mode-toggle"
							style={ {
								transform: 'scale(0.5)',
								borderRadius: 4,
							} }
							onClick={ () => {
								history.push( {} );
								navigate( 'back' );
							} }
						>
							<SiteIcon className="edit-site-layout__view-mode-toggle-icon" />
						</Button>
					</div>

					<HStack>
						<div className="edit-site-site-hub__title">
							<Button
								variant="link"
								href={ homeUrl }
								target="_blank"
								label={ __( 'View site (opens in a new tab)' ) }
							>
								{ decodeEntities( siteTitle ) }
							</Button>
						</div>
						<HStack
							spacing={ 0 }
							expanded={ false }
							className="edit-site-site-hub__actions"
						>
							<Button
								className="edit-site-site-hub_toggle-command-center"
								icon={ search }
								onClick={ () => openCommandCenter() }
								label={ __( 'Open command palette' ) }
								shortcut={ displayShortcut.primary( 'k' ) }
							/>
						</HStack>
					</HStack>
				</HStack>
			</div>
		);
	} )
);
