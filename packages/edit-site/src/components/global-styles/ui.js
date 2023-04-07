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
import { __ } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';
import { moreVertical } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect, useRef } from '@wordpress/element';

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
import ScreenFilters from './screen-filters';
import ScreenColors from './screen-colors';
import ScreenColorPalette from './screen-color-palette';
import ScreenLayout from './screen-layout';
import ScreenStyleVariations from './screen-style-variations';
import { ScreenVariation } from './screen-variations';
import ScreenBorder from './screen-border';
import StyleBook from '../style-book';
import ScreenCSS from './screen-css';
import { unlock } from '../../private-apis';
import ScreenEffects from './screen-effects';

const SLOT_FILL_NAME = 'GlobalStylesMenu';
const { Slot: GlobalStylesMenuSlot, Fill: GlobalStylesMenuFill } =
	createSlotFill( SLOT_FILL_NAME );

function GlobalStylesActionMenu() {
	const { toggle } = useDispatch( preferencesStore );
	const { canEditCSS } = useSelect( ( select ) => {
		const { getEntityRecord, __experimentalGetCurrentGlobalStylesId } =
			select( coreStore );

		const globalStylesId = __experimentalGetCurrentGlobalStylesId();
		const globalStyles = globalStylesId
			? getEntityRecord( 'root', 'globalStyles', globalStylesId )
			: undefined;

		return {
			canEditCSS:
				!! globalStyles?._links?.[ 'wp:action-edit-css' ] ?? false,
		};
	}, [] );
	const { useGlobalStylesReset } = unlock( blockEditorPrivateApis );
	const [ canReset, onReset ] = useGlobalStylesReset();
	const { goTo } = useNavigator();
	const loadCustomCSS = () => goTo( '/css' );
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

function BlockStyleVariationsScreens( { name } ) {
	const blockStyleVariations = useSelect(
		( select ) => {
			const { getBlockStyles } = select( blocksStore );
			return getBlockStyles( name );
		},
		[ name ]
	);
	if ( ! blockStyleVariations?.length ) {
		return null;
	}

	return blockStyleVariations.map( ( variation ) => (
		<ContextScreens
			key={ variation.name + name }
			name={ name }
			parentMenu={
				'/blocks/' +
				encodeURIComponent( name ) +
				'/variations/' +
				encodeURIComponent( variation.name )
			}
			variation={ variation.name }
		/>
	) );
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
			<ScreenVariation blockName={ blockName } style={ style } />
		</GlobalStylesNavigationScreen>
	) );
}

function ContextScreens( { name, parentMenu = '', variation = '' } ) {
	const blockStyleVariations = useSelect(
		( select ) => {
			const { getBlockStyles } = select( blocksStore );
			return getBlockStyles( name );
		},
		[ name ]
	);

	return (
		<>
			<GlobalStylesNavigationScreen path={ parentMenu + '/typography' }>
				<ScreenTypography name={ name } variation={ variation } />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen
				path={ parentMenu + '/typography/text' }
			>
				<ScreenTypographyElement name={ name } element="text" />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen
				path={ parentMenu + '/typography/link' }
			>
				<ScreenTypographyElement name={ name } element="link" />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen
				path={ parentMenu + '/typography/heading' }
			>
				<ScreenTypographyElement name={ name } element="heading" />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen
				path={ parentMenu + '/typography/caption' }
			>
				<ScreenTypographyElement name={ name } element="caption" />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen
				path={ parentMenu + '/typography/button' }
			>
				<ScreenTypographyElement name={ name } element="button" />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path={ parentMenu + '/colors' }>
				<ScreenColors name={ name } variation={ variation } />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen
				path={ parentMenu + '/colors/palette' }
			>
				<ScreenColorPalette name={ name } />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path={ parentMenu + '/filters' }>
				<ScreenFilters name={ name } />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path={ parentMenu + '/border' }>
				<ScreenBorder name={ name } variation={ variation } />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path={ parentMenu + '/effects' }>
				<ScreenEffects name={ name } variation={ variation } />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path={ parentMenu + '/layout' }>
				<ScreenLayout name={ name } variation={ variation } />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path={ parentMenu + '/css' }>
				<ScreenCSS name={ name } />
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

function GlobalStylesStyleBook( { onClose } ) {
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
			onClose={ onClose }
		/>
	);
}

function GlobalStylesBlockLink() {
	const navigator = useNavigator();
	const isMounted = useRef();
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
	useEffect( () => {
		// Avoid navigating to the block screen on mount.
		if ( ! isMounted.current ) {
			isMounted.current = true;
			return;
		}
		if ( ! selectedBlockClientId || ! blockHasGlobalStyles ) {
			return;
		}
		const path = '/blocks/' + encodeURIComponent( selectedBlockName );
		// Avoid navigating to the same path. This can happen when selecting
		// a new block of the same type.
		if ( path !== navigator.location.path ) {
			navigator.goTo( path, { skipFocus: true } );
		}
	}, [ selectedBlockClientId, selectedBlockName, blockHasGlobalStyles ] );
}

function GlobalStylesUI( { isStyleBookOpened, onCloseStyleBook } ) {
	const blocks = getBlockTypes();

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

			{ blocks.map( ( block, index ) => {
				return (
					<BlockStyleVariationsScreens
						key={ 'screens-block-styles-' + block.name + index }
						name={ block.name }
					/>
				);
			} ) }
			{ isStyleBookOpened && (
				<GlobalStylesStyleBook onClose={ onCloseStyleBook } />
			) }

			<GlobalStylesActionMenu />
			<GlobalStylesBlockLink />
		</NavigatorProvider>
	);
}
export { GlobalStylesMenuSlot };
export default GlobalStylesUI;
