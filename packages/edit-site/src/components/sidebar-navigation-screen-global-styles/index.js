/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { edit, seen } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useViewportMatch } from '@wordpress/compose';
import { useCallback } from '@wordpress/element';
import { store as editorStore } from '@wordpress/editor';
import { store as preferencesStore } from '@wordpress/preferences';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import SidebarButton from '../sidebar-button';
import SidebarNavigationItem from '../sidebar-navigation-item';
import StyleBook from '../style-book';
import useGlobalStylesRevisions from '../global-styles/screen-revisions/use-global-styles-revisions';
import SidebarNavigationScreenDetailsFooter from '../sidebar-navigation-screen-details-footer';
import SidebarNavigationScreenGlobalStylesContent from './content';

const { useLocation, useHistory } = unlock( routerPrivateApis );

export function SidebarNavigationItemGlobalStyles( props ) {
	const { openGeneralSidebar } = useDispatch( editSiteStore );
	const history = useHistory();
	const { params } = useLocation();
	const hasGlobalStyleVariations = useSelect(
		( select ) =>
			!! select(
				coreStore
			).__experimentalGetCurrentThemeGlobalStylesVariations()?.length,
		[]
	);
	if ( hasGlobalStyleVariations ) {
		return (
			<SidebarNavigationItem
				{ ...props }
				params={ { path: '/wp_global_styles' } }
				uid="global-styles-navigation-item"
			/>
		);
	}
	return (
		<SidebarNavigationItem
			{ ...props }
			onClick={ () => {
				// Switch to edit mode.
				history.push(
					{
						...params,
						canvasMode: 'edit',
					},
					undefined,
					{
						transition: 'canvas-mode-edit-transition',
					}
				);
				// Open global styles sidebar.
				openGeneralSidebar( 'edit-site/global-styles' );
			} }
		/>
	);
}

export default function SidebarNavigationScreenGlobalStyles( { backPath } ) {
	const history = useHistory();
	const { params } = useLocation();
	const { canvasMode = 'view' } = params;
	const { revisions, isLoading: isLoadingRevisions } =
		useGlobalStylesRevisions();
	const { openGeneralSidebar } = useDispatch( editSiteStore );
	const { setIsListViewOpened } = useDispatch( editorStore );
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const { setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);
	const { isStyleBookOpened, revisionsCount } = useSelect( ( select ) => {
		const { getEditorCanvasContainerView } = unlock(
			select( editSiteStore )
		);
		const { getEntityRecord, __experimentalGetCurrentGlobalStylesId } =
			select( coreStore );
		const globalStylesId = __experimentalGetCurrentGlobalStylesId();
		const globalStyles = globalStylesId
			? getEntityRecord( 'root', 'globalStyles', globalStylesId )
			: undefined;
		return {
			isStyleBookOpened: 'style-book' === getEditorCanvasContainerView(),
			revisionsCount:
				globalStyles?._links?.[ 'version-history' ]?.[ 0 ]?.count ?? 0,
		};
	}, [] );
	const { set: setPreference } = useDispatch( preferencesStore );

	const openGlobalStyles = useCallback( async () => {
		history.push(
			{
				...params,
				canvasMode: 'edit',
			},
			undefined,
			{
				transition: 'canvas-mode-edit-transition',
			}
		);
		return Promise.all( [
			setPreference( 'core', 'distractionFree', false ),
			openGeneralSidebar( 'edit-site/global-styles' ),
		] );
	}, [ history, params, openGeneralSidebar, setPreference ] );

	const openStyleBook = useCallback( async () => {
		await openGlobalStyles();
		// Open the Style Book once the canvas mode is set to edit,
		// and the global styles sidebar is open. This ensures that
		// the Style Book is not prematurely closed.
		setEditorCanvasContainerView( 'style-book' );
		setIsListViewOpened( false );
	}, [
		openGlobalStyles,
		setEditorCanvasContainerView,
		setIsListViewOpened,
	] );

	const openRevisions = useCallback( async () => {
		await openGlobalStyles();
		// Open the global styles revisions once the canvas mode is set to edit,
		// and the global styles sidebar is open. The global styles UI is responsible
		// for redirecting to the revisions screen once the editor canvas container
		// has been set to 'global-styles-revisions'.
		setEditorCanvasContainerView( 'global-styles-revisions' );
	}, [ openGlobalStyles, setEditorCanvasContainerView ] );

	// If there are no revisions, do not render a footer.
	const hasRevisions = revisionsCount > 0;
	const modifiedDateTime = revisions?.[ 0 ]?.modified;
	const shouldShowGlobalStylesFooter =
		hasRevisions && ! isLoadingRevisions && modifiedDateTime;

	return (
		<>
			<SidebarNavigationScreen
				title={ __( 'Styles' ) }
				description={ __(
					'Choose a different style combination for the theme styles.'
				) }
				backPath={ backPath }
				content={ <SidebarNavigationScreenGlobalStylesContent /> }
				footer={
					shouldShowGlobalStylesFooter && (
						<SidebarNavigationScreenDetailsFooter
							record={ revisions?.[ 0 ] }
							onClick={ openRevisions }
						/>
					)
				}
				actions={
					<>
						{ ! isMobileViewport && (
							<SidebarButton
								icon={ seen }
								label={ __( 'Style Book' ) }
								onClick={ () =>
									setEditorCanvasContainerView(
										! isStyleBookOpened
											? 'style-book'
											: undefined
									)
								}
								isPressed={ isStyleBookOpened }
							/>
						) }
						<SidebarButton
							icon={ edit }
							label={ __( 'Edit styles' ) }
							onClick={ async () => await openGlobalStyles() }
						/>
					</>
				}
			/>
			{ isStyleBookOpened &&
				! isMobileViewport &&
				canvasMode === 'view' && (
					<StyleBook
						enableResizing={ false }
						isSelected={ () => false }
						onClick={ openStyleBook }
						onSelect={ openStyleBook }
						showCloseButton={ false }
						showTabs={ false }
					/>
				) }
		</>
	);
}
