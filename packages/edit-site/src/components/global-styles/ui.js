/**
 * WordPress dependencies
 */
import {
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
	__experimentalUseNavigator as useNavigator,
	createSlotFill,
	DropdownMenu,
} from '@wordpress/components';
import { getBlockTypes, store as blocksStore } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __, sprintf, _n } from '@wordpress/i18n';
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
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';

const SLOT_FILL_NAME = 'GlobalStylesMenu';
const { Slot: GlobalStylesMenuSlot, Fill: GlobalStylesMenuFill } =
	createSlotFill( SLOT_FILL_NAME );

function GlobalStylesActionMenu() {
	const { toggle } = useDispatch( preferencesStore );
	const { canEditCSS, revisionsCount } = useSelect( ( select ) => {
		const { getEntityRecord, __experimentalGetCurrentGlobalStylesId } =
			select( coreStore );

		const globalStylesId = __experimentalGetCurrentGlobalStylesId();
		const globalStyles = globalStylesId
			? getEntityRecord( 'root', 'globalStyles', globalStylesId )
			: undefined;

		return {
			canEditCSS:
				!! globalStyles?._links?.[ 'wp:action-edit-css' ] ?? false,
			revisionsCount:
				globalStyles?._links?.[ 'version-history' ]?.[ 0 ]?.count ?? 0,
		};
	}, [] );
	const { useGlobalStylesReset } = unlock( blockEditorPrivateApis );
	const [ canReset, onReset ] = useGlobalStylesReset();
	const { goTo } = useNavigator();
	const { setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);
	const loadCustomCSS = () => goTo( '/css' );
	const loadRevisions = () => {
		goTo( '/revisions' );
		setEditorCanvasContainerView( 'global-styles-revisions' );
	};
	const hasRevisions = revisionsCount >= 2;

	return (
		<GlobalStylesMenuFill>
			<DropdownMenu
				icon={ moreVertical }
				label={ __( 'Styles actions' ) }
				controls={ [
					{
						title: __( 'Reset to defaults' ),
						onClick: onReset,
						isDisabled: ! canReset,
					},
					{
						title: __( 'Welcome Guide' ),
						onClick: () =>
							toggle( 'core/edit-site', 'welcomeGuideStyles' ),
					},
					...( canEditCSS
						? [
								{
									title: __( 'Additional CSS' ),
									onClick: loadCustomCSS,
								},
						  ]
						: [] ),
					...( hasRevisions
						? [
								{
									title: sprintf(
										/* translators: %d: number of revisions */
										_n(
											'%d Revision',
											'%d Revisions',
											revisionsCount
										),
										revisionsCount
									),
									onClick: loadRevisions,
								},
						  ]
						: [] ),
				] }
			/>
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

	// If the user switches the editor canvas container view, redirect
	// to the appropriate screen. This effectively allows deep linking to the
	// desired screens from outside the global styles navigation provider.
	useEffect( () => {
		if ( editorCanvasContainerView === 'global-styles-revisions' ) {
			// Switching to the revisions container view should
			// redirect to the revisions screen.
			goTo( '/revisions' );
		} else if (
			!! editorCanvasContainerView &&
			location?.path === '/revisions'
		) {
			// Switching to any container other than revisions should
			// redirect from the revisions screen to the root global styles screen.
			goTo( '/' );
		}
		// location?.path is not a dependency because we don't want to track it.
		// Doing so will cause an infinite loop. We could abstract logic to avoid
		// having to disable the check later.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ editorCanvasContainerView, goTo ] );
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
