/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { backup, styles, seen, brush } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	Icon,
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import { useViewportMatch } from '@wordpress/compose';
import { humanTimeDiff } from '@wordpress/date';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { useLink } from '../routes/link';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import SidebarButton from '../sidebar-button';
import SidebarNavigationItem from '../sidebar-navigation-item';
import StyleBook from '../style-book';
import useGlobalStylesRevisions from '../global-styles/screen-revisions/use-global-styles-revisions';

function SidebarNavigationScreenGlobalStylesFooter( { onClickRevisions } ) {
	const { revisions, isLoading } = useGlobalStylesRevisions();
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

	const hasRevisions = revisionsCount >= 2;
	const modified = revisions?.[ 0 ]?.modified;

	if ( ! hasRevisions || isLoading || ! modified ) {
		return null;
	}

	return (
		<VStack className="edit-site-sidebar-navigation-screen-global-styles__footer">
			<SidebarNavigationItem
				className="edit-site-sidebar-navigation-screen-global-styles__revisions"
				label={ __( 'Revisions' ) }
				onClick={ onClickRevisions }
			>
				<HStack
					as="span"
					alignment="center"
					spacing={ 5 }
					direction="row"
					justify="space-between"
				>
					<span className="edit-site-sidebar-navigation-screen-global-styles__revisions__label">
						{ __( 'Last modified' ) }
					</span>
					<span>
						<time dateTime={ modified }>
							{ humanTimeDiff( modified ) }
						</time>
					</span>
					<Icon icon={ backup } style={ { fill: 'currentcolor' } } />
				</HStack>
			</SidebarNavigationItem>
		</VStack>
	);
}

export default function SidebarNavigationScreenGlobalStyles() {
	const { openGeneralSidebar, setIsListViewOpened } =
		useDispatch( editSiteStore );
	const { createInfoNotice } = useDispatch( noticesStore );
	const { set: setPreference } = useDispatch( preferencesStore );
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const { setCanvasMode, setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);
	const browseStylesLink = useLink( {
		path: '/wp_global_styles/browseStyles',
	} );
	const { isStyleBookOpened, hasGlobalStyleVariations, isDistractionFree } =
		useSelect(
			( select ) => ( {
				isStyleBookOpened:
					'style-book' ===
					unlock(
						select( editSiteStore )
					).getEditorCanvasContainerView(),
				hasGlobalStyleVariations:
					!! select(
						coreStore
					).__experimentalGetCurrentThemeGlobalStylesVariations()
						?.length,
				isDistractionFree: select( preferencesStore ).get(
					editSiteStore.name,
					'distractionFree'
				),
			} ),
			[]
		);

	const openGlobalStyles = useCallback( async () => {
		// Disable distraction free mode.
		if ( isDistractionFree ) {
			setPreference( editSiteStore.name, 'distractionFree', false );
			createInfoNotice( __( 'Distraction free mode turned off.' ), {
				type: 'snackbar',
			} );
		}
		return Promise.all( [
			setCanvasMode( 'edit' ),
			openGeneralSidebar( 'edit-site/global-styles' ),
		] );
	}, [ setCanvasMode, openGeneralSidebar, isDistractionFree ] );

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

	return (
		<>
			<SidebarNavigationScreen
				title={ __( 'Styles' ) }
				description={ __(
					'Customize the visual styles of your entire website.'
				) }
				content={
					<ItemGroup>
						{ hasGlobalStyleVariations && (
							<SidebarNavigationItem
								icon={ brush }
								withChevron
								{ ...browseStylesLink }
							>
								{ __( 'Browse styles' ) }
							</SidebarNavigationItem>
						) }
						<SidebarNavigationItem
							icon={ styles }
							onClick={ openGlobalStyles }
						>
							{ __( 'Edit styles' ) }
						</SidebarNavigationItem>
					</ItemGroup>
				}
				footer={
					<SidebarNavigationScreenGlobalStylesFooter
						onClickRevisions={ openRevisions }
					/>
				}
				actions={
					! isMobileViewport && (
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
					)
				}
			/>
			{ isStyleBookOpened && ! isMobileViewport && (
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
