/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { typography, color, layout } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { store as coreStore } from '@wordpress/core-data';
import {
	__experimentalNavigatorButton as NavigatorButton,
	__experimentalItemGroup as ItemGroup,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { useLink } from '../routes/link';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import SidebarNavigationItem from '../sidebar-navigation-item';
import useGlobalStylesRevisions from '../global-styles/screen-revisions/use-global-styles-revisions';
import SidebarNavigationScreenDetailsFooter from '../sidebar-navigation-screen-details-footer';

const { useLocation } = unlock( routerPrivateApis );

export function SidebarNavigationItemGlobalStyles( props ) {
	const { openGeneralSidebar } = useDispatch( editSiteStore );
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );

	const hasGlobalStyleVariations = useSelect(
		( select ) =>
			!! select(
				coreStore
			).__experimentalGetCurrentThemeGlobalStylesVariations()?.length,
		[]
	);
	if ( hasGlobalStyleVariations ) {
		return (
			<NavigatorButton
				{ ...props }
				as={ SidebarNavigationItem }
				path="/wp_global_styles"
			/>
		);
	}
	return (
		<SidebarNavigationItem
			{ ...props }
			onClick={ () => {
				// Switch to edit mode.
				setCanvasMode( 'edit' );
				// Open global styles sidebar.
				openGeneralSidebar( 'edit-site/global-styles' );
			} }
		/>
	);
}

function SidebarNavigationScreenGlobalStylesContent() {
	const {
		params: { path },
	} = useLocation();

	const variationsLink = useLink( {
		path,
		activeView: '/variations',
	} );

	const typographyLink = useLink( {
		path,
		activeView: '/typography',
	} );

	const colorsLink = useLink( {
		path,
		activeView: '/colors',
	} );

	const layoutLink = useLink( {
		path,
		activeView: '/layout',
	} );

	const blocksLink = useLink( {
		path,
		activeView: '/blocks',
	} );

	// Wrap in a BlockEditorProvider to ensure that the Iframe's dependencies are
	// loaded. This is necessary because the Iframe component waits until
	// the block editor store's `__internalIsInitialized` is true before
	// rendering the iframe. Without this, the iframe previews will not render
	// in mobile viewport sizes, where the editor canvas is hidden.
	return (
		<>
			<div className="edit-site-sidebar-navigation-screen-patterns__group-header">
				<Heading level={ 2 }>{ __( 'Active' ) }</Heading>
			</div>
			<ItemGroup>
				<SidebarNavigationItem
					{ ...variationsLink }
					aria-current={ false ? 'true' : undefined }
				>
					Moonlight
				</SidebarNavigationItem>
			</ItemGroup>
			<div className="edit-site-sidebar-navigation-screen-patterns__group-header">
				<Heading level={ 2 }>{ __( 'Customize' ) }</Heading>
			</div>
			<ItemGroup>
				<SidebarNavigationItem
					{ ...typographyLink }
					icon={ typography }
					aria-current={ false ? 'true' : undefined }
				>
					Typography
				</SidebarNavigationItem>
				<SidebarNavigationItem
					{ ...colorsLink }
					icon={ color }
					aria-current={ false ? 'true' : undefined }
				>
					Colors
				</SidebarNavigationItem>
				<SidebarNavigationItem
					{ ...layoutLink }
					icon={ layout }
					aria-current={ false ? 'true' : undefined }
				>
					Layout
				</SidebarNavigationItem>
				<SidebarNavigationItem
					{ ...blocksLink }
					icon={ layout }
					aria-current={ false ? 'true' : undefined }
				>
					Blocks
				</SidebarNavigationItem>
			</ItemGroup>
		</>
	);
}

export default function SidebarNavigationScreenGlobalStyles() {
	const { revisions, isLoading: isLoadingRevisions } =
		useGlobalStylesRevisions();
	const { openGeneralSidebar } = useDispatch( editSiteStore );
	const { setCanvasMode, setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);
	const { revisionsCount } = useSelect( ( select ) => {
		const { getEntityRecord, __experimentalGetCurrentGlobalStylesId } =
			select( coreStore );
		const globalStylesId = __experimentalGetCurrentGlobalStylesId();
		const globalStyles = globalStylesId
			? getEntityRecord( 'root', 'globalStyles', globalStylesId )
			: undefined;
		return {
			revisionsCount:
				globalStyles?._links?.[ 'version-history' ]?.[ 0 ]?.count ?? 0,
		};
	}, [] );

	const openGlobalStyles = useCallback( async () => {
		return Promise.all( [
			setCanvasMode( 'edit' ),
			openGeneralSidebar( 'edit-site/global-styles' ),
		] );
	}, [ setCanvasMode, openGeneralSidebar ] );

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
				content={ <SidebarNavigationScreenGlobalStylesContent /> }
				footer={
					shouldShowGlobalStylesFooter && (
						<SidebarNavigationScreenDetailsFooter
							record={ revisions?.[ 0 ] }
							onClick={ openRevisions }
						/>
					)
				}
			/>
		</>
	);
}
