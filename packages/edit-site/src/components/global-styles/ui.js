/**
 * WordPress dependencies
 */
import {
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
	__experimentalUseNavigator as useNavigator,
	createSlotFill,
	DropdownMenu,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { getBlockTypes, store as blocksStore } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';
import { moreVertical } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ScreenRoot from './screen-root';
import {
	useBlockHasGlobalStyles,
	default as ScreenBlockList,
} from './screen-block-list';
import ScreenBlock from './screen-block';
import ScreenTypography from './screen-typography';
import ScreenTypographyElement from './screen-typography-element';
import ScreenColors from './screen-colors';
import ScreenColorPalette from './screen-color-palette';
import ScreenLayout from './screen-layout';
import ScreenStyleVariations from './screen-style-variations';
import StyleBook from '../style-book';
import ScreenCSS from './screen-css';
import ScreenRevisions from './screen-revisions';
import ScreenBackground from './screen-background';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';

const SLOT_FILL_NAME = 'GlobalStylesMenu';
const { useGlobalStylesReset } = unlock( blockEditorPrivateApis );
const { Slot: GlobalStylesMenuSlot, Fill: GlobalStylesMenuFill } =
	createSlotFill( SLOT_FILL_NAME );

function GlobalStylesActionMenu() {
	const [ canReset, onReset ] = useGlobalStylesReset();
	const { toggle } = useDispatch( preferencesStore );
	const { canEditCSS } = useSelect( ( select ) => {
		const { getEntityRecord, __experimentalGetCurrentGlobalStylesId } =
			select( coreStore );

		const globalStylesId = __experimentalGetCurrentGlobalStylesId();
		const globalStyles = globalStylesId
			? getEntityRecord( 'root', 'globalStyles', globalStylesId )
			: undefined;

		return {
			canEditCSS: !! globalStyles?._links?.[ 'wp:action-edit-css' ],
		};
	}, [] );
	const { setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);
	const { goTo } = useNavigator();
	const loadCustomCSS = () => {
		setEditorCanvasContainerView( 'global-styles-css' );
		goTo( '/css' );
	};

	return (
		<GlobalStylesMenuFill>
			<DropdownMenu icon={ moreVertical } label={ __( 'More' ) }>
				{ ( { onClose } ) => (
					<>
						<MenuGroup>
							{ canEditCSS && (
								<MenuItem onClick={ loadCustomCSS }>
									{ __( 'Additional CSS' ) }
								</MenuItem>
							) }
							<MenuItem
								onClick={ () => {
									toggle(
										'core/edit-site',
										'welcomeGuideStyles'
									);
									onClose();
								} }
							>
								{ __( 'Welcome Guide' ) }
							</MenuItem>
						</MenuGroup>
						<MenuGroup>
							<MenuItem
								onClick={ () => {
									onReset();
									onClose();
								} }
								disabled={ ! canReset }
							>
								{ __( 'Reset styles' ) }
							</MenuItem>
						</MenuGroup>
					</>
				) }
			</DropdownMenu>
		</GlobalStylesMenuFill>
	);
}

function GlobalStylesNavigationScreen( { className, ...props } ) {
	return (
		<NavigatorScreen
			className={ [
				'edit-site-global-styles-sidebar__navigator-screen',
				className,
			]
				.filter( Boolean )
				.join( ' ' ) }
			{ ...props }
		/>
	);
}

function BlockStylesNavigationScreens( {
	parentMenu,
	blockStyles,
	blockName,
} ) {
	return blockStyles.map( ( style, index ) => (
		<GlobalStylesNavigationScreen
			key={ index }
			path={ parentMenu + '/variations/' + style.name }
		>
			<ScreenBlock name={ blockName } variation={ style.name } />
		</GlobalStylesNavigationScreen>
	) );
}

function ContextScreens( { name, parentMenu = '' } ) {
	const blockStyleVariations = useSelect(
		( select ) => {
			const { getBlockStyles } = select( blocksStore );
			return getBlockStyles( name );
		},
		[ name ]
	);

	return (
		<>
			<GlobalStylesNavigationScreen
				path={ parentMenu + '/colors/palette' }
			>
				<ScreenColorPalette name={ name } />
			</GlobalStylesNavigationScreen>

			{ !! blockStyleVariations?.length && (
				<BlockStylesNavigationScreens
					parentMenu={ parentMenu }
					blockStyles={ blockStyleVariations }
					blockName={ name }
				/>
			) }
		</>
	);
}

function GlobalStylesStyleBook() {
	const navigator = useNavigator();
	const { path } = navigator.location;
	return (
		<StyleBook
			isSelected={ ( blockName ) =>
				// Match '/blocks/core%2Fbutton' and
				// '/blocks/core%2Fbutton/typography', but not
				// '/blocks/core%2Fbuttons'.
				path === `/blocks/${ encodeURIComponent( blockName ) }` ||
				path.startsWith(
					`/blocks/${ encodeURIComponent( blockName ) }/`
				)
			}
			onSelect={ ( blockName ) => {
				// Now go to the selected block.
				navigator.goTo( '/blocks/' + encodeURIComponent( blockName ) );
			} }
		/>
	);
}

function GlobalStylesBlockLink() {
	const navigator = useNavigator();
	const { selectedBlockName, selectedBlockClientId } = useSelect(
		( select ) => {
			const { getSelectedBlockClientId, getBlockName } =
				select( blockEditorStore );
			const clientId = getSelectedBlockClientId();
			return {
				selectedBlockName: getBlockName( clientId ),
				selectedBlockClientId: clientId,
			};
		},
		[]
	);
	const blockHasGlobalStyles = useBlockHasGlobalStyles( selectedBlockName );
	// When we're in the `Blocks` screen enable deep linking to the selected block.
	useEffect( () => {
		if ( ! selectedBlockClientId || ! blockHasGlobalStyles ) {
			return;
		}
		const currentPath = navigator.location.path;
		if (
			currentPath !== '/blocks' &&
			! currentPath.startsWith( '/blocks/' )
		) {
			return;
		}
		const newPath = '/blocks/' + encodeURIComponent( selectedBlockName );
		// Avoid navigating to the same path. This can happen when selecting
		// a new block of the same type.
		if ( newPath !== currentPath ) {
			navigator.goTo( newPath, { skipFocus: true } );
		}
	}, [ selectedBlockClientId, selectedBlockName, blockHasGlobalStyles ] );
}

function GlobalStylesEditorCanvasContainerLink() {
	const { goTo, location } = useNavigator();
	const editorCanvasContainerView = useSelect(
		( select ) =>
			unlock( select( editSiteStore ) ).getEditorCanvasContainerView(),
		[]
	);
	const path = location?.path;
	const isRevisionsOpen = path === '/revisions';

	// If the user switches the editor canvas container view, redirect
	// to the appropriate screen. This effectively allows deep linking to the
	// desired screens from outside the global styles navigation provider.
	useEffect( () => {
		switch ( editorCanvasContainerView ) {
			case 'global-styles-revisions':
			case 'global-styles-revisions:style-book':
				goTo( '/revisions' );
				break;
			case 'global-styles-css':
				goTo( '/css' );
				break;
			case 'style-book':
				/*
				 * The stand-alone style book is open
				 * and the revisions panel is open,
				 * close the revisions panel.
				 * Otherwise keep the style book open while
				 * browsing global styles panel.
				 */
				if ( isRevisionsOpen ) {
					goTo( '/' );
				}
				break;
			default:
				/*
				 * Example: the user has navigated to "Browse styles" or elsewhere
				 * and changes the editorCanvasContainerView, e.g., closes the style book.
				 * The panel should not be affected.
				 * Exclude revisions panel from this behavior,
				 * as it should close when the editorCanvasContainerView doesn't correspond.
				 */
				if ( path !== '/' && ! isRevisionsOpen ) {
					return;
				}
				goTo( '/' );
				break;
		}
	}, [ editorCanvasContainerView, isRevisionsOpen, goTo ] );
}

function GlobalStylesUI() {
	const blocks = getBlockTypes();
	const editorCanvasContainerView = useSelect(
		( select ) =>
			unlock( select( editSiteStore ) ).getEditorCanvasContainerView(),
		[]
	);
	return (
		<NavigatorProvider
			className="edit-site-global-styles-sidebar__navigator-provider"
			initialPath="/"
		>
			<GlobalStylesNavigationScreen path="/">
				<ScreenRoot />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path="/variations">
				<ScreenStyleVariations />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path="/blocks">
				<ScreenBlockList />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path="/typography">
				<ScreenTypography />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path="/typography/text">
				<ScreenTypographyElement element="text" />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path="/typography/link">
				<ScreenTypographyElement element="link" />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path="/typography/heading">
				<ScreenTypographyElement element="heading" />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path="/typography/caption">
				<ScreenTypographyElement element="caption" />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path="/typography/button">
				<ScreenTypographyElement element="button" />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path="/colors">
				<ScreenColors />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path="/layout">
				<ScreenLayout />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path="/css">
				<ScreenCSS />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path={ '/revisions' }>
				<ScreenRevisions />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path={ '/background' }>
				<ScreenBackground />
			</GlobalStylesNavigationScreen>

			{ blocks.map( ( block ) => (
				<GlobalStylesNavigationScreen
					key={ 'menu-block-' + block.name }
					path={ '/blocks/' + encodeURIComponent( block.name ) }
				>
					<ScreenBlock name={ block.name } />
				</GlobalStylesNavigationScreen>
			) ) }

			<ContextScreens />

			{ blocks.map( ( block ) => (
				<ContextScreens
					key={ 'screens-block-' + block.name }
					name={ block.name }
					parentMenu={ '/blocks/' + encodeURIComponent( block.name ) }
				/>
			) ) }

			{ 'style-book' === editorCanvasContainerView && (
				<GlobalStylesStyleBook />
			) }

			<GlobalStylesActionMenu />
			<GlobalStylesBlockLink />
			<GlobalStylesEditorCanvasContainerLink />
		</NavigatorProvider>
	);
}
export { GlobalStylesMenuSlot };
export default GlobalStylesUI;
