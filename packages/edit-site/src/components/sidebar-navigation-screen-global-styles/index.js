/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { backup, edit, seen } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	Icon,
	__experimentalNavigatorButton as NavigatorButton,
	__experimentalVStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { BlockEditorProvider } from '@wordpress/block-editor';
import { humanTimeDiff } from '@wordpress/date';
import { useCallback } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import StyleVariationsContainer from '../global-styles/style-variations-container';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import SidebarButton from '../sidebar-button';
import SidebarNavigationItem from '../sidebar-navigation-item';
import StyleBook from '../style-book';
import useGlobalStylesRevisions from '../global-styles/screen-revisions/use-global-styles-revisions';

const noop = () => {};

export function SidebarNavigationItemGlobalStyles( props ) {
	const { openGeneralSidebar } = useDispatch( editSiteStore );
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const { createNotice } = useDispatch( noticesStore );
	const { set: setPreference } = useDispatch( preferencesStore );
	const { get: getPrefference } = useSelect( preferencesStore );

	const turnOffDistractionFreeMode = useCallback( () => {
		const isDistractionFree = getPrefference(
			editSiteStore.name,
			'distractionFree'
		);
		if ( ! isDistractionFree ) {
			return;
		}
		setPreference( editSiteStore.name, 'distractionFree', false );
		createNotice( 'info', __( 'Distraction free mode turned off' ), {
			isDismissible: true,
			type: 'snackbar',
		} );
	}, [ createNotice, setPreference, getPrefference ] );
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
				turnOffDistractionFreeMode();
				// Switch to edit mode.
				setCanvasMode( 'edit' );
				// Open global styles sidebar.
				openGeneralSidebar( 'edit-site/global-styles' );
			} }
		/>
	);
}

function SidebarNavigationScreenGlobalStylesContent() {
	const { storedSettings } = useSelect( ( select ) => {
		const { getSettings } = unlock( select( editSiteStore ) );

		return {
			storedSettings: getSettings( false ),
		};
	}, [] );

	// Wrap in a BlockEditorProvider to ensure that the Iframe's dependencies are
	// loaded. This is necessary because the Iframe component waits until
	// the block editor store's `__internalIsInitialized` is true before
	// rendering the iframe. Without this, the iframe previews will not render
	// in mobile viewport sizes, where the editor canvas is hidden.
	return (
		<BlockEditorProvider
			settings={ storedSettings }
			onChange={ noop }
			onInput={ noop }
		>
			<StyleVariationsContainer />
		</BlockEditorProvider>
	);
}

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
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const { setCanvasMode, setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);
	const { createNotice } = useDispatch( noticesStore );
	const { set: setPreference } = useDispatch( preferencesStore );
	const { get: getPrefference } = useSelect( preferencesStore );

	const isStyleBookOpened = useSelect(
		( select ) =>
			'style-book' ===
			unlock( select( editSiteStore ) ).getEditorCanvasContainerView(),
		[]
	);

	const turnOffDistractionFreeMode = useCallback( () => {
		const isDistractionFree = getPrefference(
			editSiteStore.name,
			'distractionFree'
		);
		if ( ! isDistractionFree ) {
			return;
		}
		setPreference( editSiteStore.name, 'distractionFree', false );
		createNotice( 'info', __( 'Distraction free mode turned off' ), {
			isDismissible: true,
			type: 'snackbar',
		} );
	}, [ createNotice, setPreference, getPrefference ] );

	const openGlobalStyles = useCallback( async () => {
		turnOffDistractionFreeMode();
		return Promise.all( [
			setCanvasMode( 'edit' ),
			openGeneralSidebar( 'edit-site/global-styles' ),
		] );
	}, [ setCanvasMode, openGeneralSidebar, turnOffDistractionFreeMode ] );

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
					'Choose a different style combination for the theme styles.'
				) }
				content={ <SidebarNavigationScreenGlobalStylesContent /> }
				footer={
					<SidebarNavigationScreenGlobalStylesFooter
						onClickRevisions={ openRevisions }
					/>
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
