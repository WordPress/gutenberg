/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
	__experimentalNavigatorToParentButton as NavigatorToParentButton,
	__experimentalUseNavigator as useNavigator,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { isRTL, __, sprintf } from '@wordpress/i18n';
import { chevronRight, chevronLeft } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';
import SidebarButton from '../sidebar-button';
import {
	isPreviewingTheme,
	currentlyPreviewingTheme,
} from '../../utils/is-previewing-theme';

export default function SidebarNavigationScreen( {
	isRoot,
	title,
	actions,
	meta,
	content,
	footer,
	description,
	backPath,
} ) {
	const { dashboardLink } = useSelect( ( select ) => {
		const { getSettings } = unlock( select( editSiteStore ) );
		return {
			dashboardLink: getSettings().__experimentalDashboardLink,
		};
	}, [] );
	const { getTheme } = useSelect( coreStore );
	const { goTo } = useNavigator();
	const theme = getTheme( currentlyPreviewingTheme() );
	const icon = isRTL() ? chevronRight : chevronLeft;

	return (
		<>
			<VStack
				className="edit-site-sidebar-navigation-screen__main"
				spacing={ 0 }
				justify="flex-start"
			>
				<HStack
					spacing={ 4 }
					alignment="flex-start"
					className="edit-site-sidebar-navigation-screen__title-icon"
				>
					{ ! isRoot && ! backPath && (
						<NavigatorToParentButton
							as={ SidebarButton }
							icon={ isRTL() ? chevronRight : chevronLeft }
							label={ __( 'Back' ) }
							showTooltip={ false }
						/>
					) }
					{ ! isRoot && backPath && (
						<SidebarButton
							onClick={ () => goTo( backPath, { isBack: true } ) }
							icon={ icon }
							label={ __( 'Back' ) }
							showTooltip={ false }
						/>
					) }
					{ isRoot && (
						<SidebarButton
							icon={ icon }
							label={
								! isPreviewingTheme()
									? __( 'Go back to the Dashboard' )
									: __( 'Go back to the theme showcase' )
							}
							href={
								! isPreviewingTheme()
									? dashboardLink || 'index.php'
									: 'themes.php'
							}
						/>
					) }
					<Heading
						className="edit-site-sidebar-navigation-screen__title"
						color={ '#e0e0e0' /* $gray-200 */ }
						level={ 1 }
						size={ 20 }
					>
						{ ! isPreviewingTheme()
							? title
							: sprintf(
									'Previewing %1$s: %2$s',
									theme?.name?.rendered,
									title
							  ) }
					</Heading>
					{ actions && (
						<div className="edit-site-sidebar-navigation-screen__actions">
							{ actions }
						</div>
					) }
				</HStack>
				{ meta && (
					<>
						<div className="edit-site-sidebar-navigation-screen__meta">
							{ meta }
						</div>
					</>
				) }

				<div className="edit-site-sidebar-navigation-screen__content">
					{ description && (
						<p className="edit-site-sidebar-navigation-screen__description">
							{ description }
						</p>
					) }
					{ content }
				</div>
			</VStack>
			{ footer && (
				<footer className="edit-site-sidebar-navigation-screen__footer">
					{ footer }
				</footer>
			) }
		</>
	);
}
