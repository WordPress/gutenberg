/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import SidebarNavigationItem from '../sidebar-navigation-item';
import useGlobalStylesRevisions from '../global-styles/screen-revisions/use-global-styles-revisions';
import SidebarNavigationScreenDetailsFooter from '../sidebar-navigation-screen-details-footer';
import { MainSidebarNavigationContent } from '../sidebar-navigation-screen-main';

const { useLocation, useHistory } = unlock( routerPrivateApis );

export function SidebarNavigationItemGlobalStyles( props ) {
	const { name } = useLocation();
	return (
		<SidebarNavigationItem
			{ ...props }
			aria-current={ name === 'styles' }
		/>
	);
}

export default function SidebarNavigationScreenGlobalStyles() {
	const history = useHistory();
	const { path } = useLocation();
	const {
		revisions,
		isLoading: isLoadingRevisions,
		revisionsCount,
	} = useGlobalStylesRevisions();
	const { openGeneralSidebar } = useDispatch( editSiteStore );
	const { setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);
	const { set: setPreference } = useDispatch( preferencesStore );

	const openGlobalStyles = useCallback( async () => {
		history.navigate( addQueryArgs( path, { canvas: 'edit' } ), {
			transition: 'canvas-mode-edit-transition',
		} );
		return Promise.all( [
			setPreference( 'core', 'distractionFree', false ),
			openGeneralSidebar( 'edit-site/global-styles' ),
		] );
	}, [ path, history, openGeneralSidebar, setPreference ] );

	const openRevisions = useCallback( async () => {
		await openGlobalStyles();
		// Open the global styles revisions once the canvas mode is set to edit,
		// and the global styles sidebar is open. The global styles UI is responsible
		// for redirecting to the revisions screen once the editor canvas container
		// has been set to 'global-styles-revisions'.
		setEditorCanvasContainerView( 'global-styles-revisions' );
	}, [ openGlobalStyles, setEditorCanvasContainerView ] );

	// If there are no revisions, do not render a footer.
	const shouldShowGlobalStylesFooter =
		!! revisionsCount && ! isLoadingRevisions;

	return (
		<>
			<SidebarNavigationScreen
				title={ __( 'Design' ) }
				isRoot
				description={ __(
					'Customize the appearance of your website using the block editor.'
				) }
				content={
					<MainSidebarNavigationContent activeItem="styles-navigation-item" />
				}
				footer={
					shouldShowGlobalStylesFooter && (
						<SidebarNavigationScreenDetailsFooter
							record={ revisions?.[ 0 ] }
							revisionsCount={ revisionsCount }
							onClick={ openRevisions }
						/>
					)
				}
			/>
		</>
	);
}
