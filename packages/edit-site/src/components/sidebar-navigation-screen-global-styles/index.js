/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { edit } from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import StyleVariationsContainer from '../global-styles/style-variations-container';
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';
import SidebarButton from '../sidebar-button';

export default function SidebarNavigationScreenGlobalStyles() {
	const { openGeneralSidebar } = useDispatch( editSiteStore );
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	return (
		<SidebarNavigationScreen
			title={ __( 'Styles' ) }
			description={ __(
				'Choose a different style combination for the theme styles.'
			) }
			content={ <StyleVariationsContainer /> }
			actions={
				<SidebarButton
					icon={ edit }
					label={ __( 'Edit styles' ) }
					onClick={ () => {
						// switch to edit mode.
						setCanvasMode( 'edit' );
						// open global styles sidebar.
						openGeneralSidebar( 'edit-site/global-styles' );
					} }
				/>
			}
		/>
	);
}
