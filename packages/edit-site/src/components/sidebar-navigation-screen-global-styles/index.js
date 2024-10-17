/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useViewportMatch } from '@wordpress/compose';
import { useCallback, useState } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import { layout, seen } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import SidebarNavigationItem from '../sidebar-navigation-item';
import StyleBook from '../style-book';
import useGlobalStylesRevisions from '../global-styles/screen-revisions/use-global-styles-revisions';
import SidebarNavigationScreenDetailsFooter from '../sidebar-navigation-screen-details-footer';
import { MainSidebarNavigationContent } from '../sidebar-navigation-screen-main';
import SidebarButton from '../sidebar-button';

const { useLocation } = unlock( routerPrivateApis );

export function SidebarNavigationItemGlobalStyles( props ) {
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
				aria-current={
					params.path && params.path.startsWith( '/wp_global_styles' )
				}
			/>
		);
	}
	return <SidebarNavigationItem { ...props } />;
}

export default function SidebarNavigationScreenGlobalStyles() {
	const { revisions, isLoading: isLoadingRevisions } =
		useGlobalStylesRevisions();
	const { openGeneralSidebar } = useDispatch( editSiteStore );
	const [ isViewingStyleBook, setIsViewingStyleBook ] = useState( true );
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const { setCanvasMode, setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);
	const { isViewMode, revisionsCount } = useSelect( ( select ) => {
		const { getCanvasMode } = unlock( select( editSiteStore ) );
		const { getEntityRecord, __experimentalGetCurrentGlobalStylesId } =
			select( coreStore );
		const globalStylesId = __experimentalGetCurrentGlobalStylesId();
		const globalStyles = globalStylesId
			? getEntityRecord( 'root', 'globalStyles', globalStylesId )
			: undefined;
		return {
			isViewMode: 'view' === getCanvasMode(),
			revisionsCount:
				globalStyles?._links?.[ 'version-history' ]?.[ 0 ]?.count ?? 0,
		};
	}, [] );
	const { set: setPreference } = useDispatch( preferencesStore );

	const openGlobalStyles = useCallback( async () => {
		return Promise.all( [
			setPreference( 'core', 'distractionFree', false ),
			setCanvasMode( 'edit' ),
			openGeneralSidebar( 'edit-site/global-styles' ),
		] );
	}, [ setCanvasMode, openGeneralSidebar, setPreference ] );

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
				title={ __( 'Design' ) }
				isRoot
				description={ __(
					'Customize the appearance of your website using the block editor.'
				) }
				content={
					<MainSidebarNavigationContent activeItem="styles-navigation-item" />
				}
				actions={
					<>
						{ ! isMobileViewport && (
							<SidebarButton
								icon={ isViewingStyleBook ? layout : seen }
								label={
									isViewingStyleBook
										? __( 'See homepage' )
										: __( 'See style Book' )
								}
								onClick={ () =>
									setIsViewingStyleBook(
										! isViewingStyleBook
									)
								}
							/>
						) }
					</>
				}
				footer={
					shouldShowGlobalStylesFooter && (
						<SidebarNavigationScreenDetailsFooter
							record={ revisions?.[ 0 ] }
							onClick={ openRevisions }
						/>
					)
				}
			/>
			{ isViewMode && isViewingStyleBook && (
				<StyleBook
					enableResizing={ false }
					isSelected={ () => false }
					showCloseButton={ false }
					showTabs={ false }
					onClick={ () => {} }
				/>
			) }
		</>
	);
}
