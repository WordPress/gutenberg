/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Button, __experimentalHStack as HStack } from '@wordpress/components';
import { __, isRTL } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { memo, forwardRef, useContext } from '@wordpress/element';
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { SidebarNavigationContext } from '../sidebar';
const { useLocation, useHistory } = unlock( routerPrivateApis );

export const SiteHubMobile = memo(
	forwardRef( ( { isTransparent }, ref ) => {
		const { path } = useLocation();
		const history = useHistory();
		const { navigate } = useContext( SidebarNavigationContext );

		const {
			dashboardLink,
			isBlockTheme,
			isClassicThemeWithStyleBookSupport,
		} = useSelect( ( select ) => {
			const { getSettings } = unlock( select( editSiteStore ) );
			const { getCurrentTheme } = select( coreStore );
			const currentTheme = getCurrentTheme();
			const settings = getSettings();
			const supportsEditorStyles =
				currentTheme?.theme_supports[ 'editor-styles' ];
			// This is a temp solution until the has_theme_json value is available for the current theme.
			const hasThemeJson = settings.supportsLayout;

			return {
				dashboardLink: settings.__experimentalDashboardLink,
				isBlockTheme: currentTheme?.is_block_theme,
				isClassicThemeWithStyleBookSupport:
					! currentTheme?.is_block_theme &&
					( supportsEditorStyles || hasThemeJson ),
			};
		}, [] );

		let backPath;

		// If the current path is not the root page, find a page to back to.
		if ( path !== '/' ) {
			if ( isBlockTheme || isClassicThemeWithStyleBookSupport ) {
				// If the current theme is a block theme or a classic theme that supports StyleBook,
				// back to the Design screen.
				backPath = '/';
			} else if ( path !== '/pattern' ) {
				// If the current theme is a classic theme that does not support StyleBook,
				// back to the Patterns page.
				backPath = '/pattern';
			}
		}

		const backButtonProps = {
			href: !! backPath ? undefined : dashboardLink,
			label: !! backPath
				? __( 'Go to Site Editor' )
				: __( 'Go to the Dashboard' ),
			onClick: !! backPath
				? () => {
						history.navigate( backPath );
						navigate( 'back' );
				  }
				: undefined,
		};

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
							__next40pxDefaultSize
							ref={ ref }
							className="edit-site-layout__view-mode-toggle"
							style={ {
								transform: 'scale(0.5)',
								borderRadius: 4,
							} }
							{ ...backButtonProps }
						>
							<Icon
								icon={ isRTL() ? chevronRight : chevronLeft }
								size={ 48 }
							/>
						</Button>
					</div>
				</HStack>
			</div>
		);
	} )
);
