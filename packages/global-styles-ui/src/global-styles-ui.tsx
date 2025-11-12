/**
 * WordPress dependencies
 */
import { Navigator, useNavigator } from '@wordpress/components';
// @ts-expect-error: Not typed yet.
import { getBlockTypes, store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
// @ts-expect-error: Not typed yet.
import { BlockEditorProvider } from '@wordpress/block-editor';
import { useMemo, useEffect } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';
import {
	generateGlobalStyles,
	mergeGlobalStyles,
} from '@wordpress/global-styles-engine';
import type {
	GlobalStylesConfig,
	BlockType,
} from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { GlobalStylesProvider } from './provider';
import ScreenRoot from './screen-root';
import ScreenBlockList from './screen-block-list';
import ScreenBlock from './screen-block';
import ScreenTypography from './screen-typography';
import ScreenTypographyElement from './screen-typography-element';
import ScreenColors from './screen-colors';
import ScreenColorPalette from './screen-color-palette';
import ScreenBackground from './screen-background';
import { ScreenShadows, ScreenShadowsEdit } from './screen-shadows';
import ScreenLayout from './screen-layout';
import ScreenStyleVariations from './screen-style-variations';
import ScreenCSS from './screen-css';
import ScreenRevisions from './screen-revisions';
import FontSizes from './font-sizes/font-sizes';
import FontSize from './font-sizes/font-size';
interface BlockStylesNavigationScreensProps {
	parentMenu: string;
	blockStyles: any[];
	blockName: string;
}

function BlockStylesNavigationScreens( {
	parentMenu,
	blockStyles,
	blockName,
}: BlockStylesNavigationScreensProps ) {
	return (
		<>
			{ blockStyles.map( ( style, index ) => (
				<Navigator.Screen
					key={ index }
					path={ parentMenu + '/variations/' + style.name }
				>
					<ScreenBlock name={ blockName } variation={ style.name } />
				</Navigator.Screen>
			) ) }
		</>
	);
}

interface ContextScreensProps {
	name?: string;
	parentMenu?: string;
}

function ContextScreens( { name, parentMenu = '' }: ContextScreensProps ) {
	const blockStyleVariations = useSelect(
		( select ) => {
			if ( ! name ) {
				return [];
			}
			const { getBlockStyles } = select( blocksStore );
			return getBlockStyles( name );
		},
		[ name ]
	);

	return (
		<>
			<Navigator.Screen path={ parentMenu + '/colors/palette' }>
				<ScreenColorPalette name={ name } />
			</Navigator.Screen>

			{ !! blockStyleVariations?.length && (
				<BlockStylesNavigationScreens
					parentMenu={ parentMenu }
					blockStyles={ blockStyleVariations }
					blockName={ name || '' }
				/>
			) }
		</>
	);
}

interface GlobalStylesUIProps {
	/** User global styles object (what gets edited) */
	value: GlobalStylesConfig;
	/** Base global styles object (theme default) */
	baseValue: GlobalStylesConfig;
	/** Callback when global styles change */
	onChange: ( newValue: GlobalStylesConfig ) => void;
	/** Current navigation path (optional) */
	path?: string;
	/** Callback when navigation path changes (optional) */
	onPathChange?: ( path: string ) => void;
	/** Whether font library is enabled (optional) */
	fontLibraryEnabled?: boolean;
	/** Server CSS styles for BlockEditorProvider (optional) */
	serverCSS?: { isGlobalStyles?: boolean }[];
	/** Server settings for BlockEditorProvider (optional) */
	serverSettings?: { __unstableResolvedAssets: Record< string, unknown > };
}

export function GlobalStylesUI( {
	value,
	baseValue,
	onChange,
	path,
	onPathChange,
	fontLibraryEnabled = false,
	serverCSS,
	serverSettings,
}: GlobalStylesUIProps ) {
	const blocks = getBlockTypes();

	// Compute merged value for CSS generation
	const mergedValue = useMemo( () => {
		return mergeGlobalStyles( baseValue, value );
	}, [ baseValue, value ] );

	const [ globalStylesCSS, globalSettings ] =
		generateGlobalStyles( mergedValue );
	const styles = useMemo(
		() => [ ...( serverCSS ?? [] ), ...( globalStylesCSS ?? [] ) ],
		[ serverCSS, globalStylesCSS ]
	);

	const settings = useMemo( () => {
		return {
			...serverSettings,
			__experimentalFeatures: globalSettings,
			styles,
		};
	}, [ globalSettings, serverSettings, styles ] );

	return (
		<GlobalStylesProvider
			value={ value }
			baseValue={ baseValue }
			onChange={ onChange }
			fontLibraryEnabled={ fontLibraryEnabled }
		>
			<BlockEditorProvider settings={ settings }>
				<Navigator
					className="global-styles-ui-sidebar__navigator-provider"
					initialPath={ path || '/' }
				>
					{ ( path || onPathChange ) && (
						<PathSynchronizer
							path={ path }
							onPathChange={ onPathChange }
						/>
					) }
					<Navigator.Screen path="/">
						<ScreenRoot />
					</Navigator.Screen>
					<Navigator.Screen path="/colors">
						<ScreenColors />
					</Navigator.Screen>
					<Navigator.Screen path="/typography">
						<ScreenTypography />
					</Navigator.Screen>
					<Navigator.Screen path="/typography/font-sizes">
						<FontSizes />
					</Navigator.Screen>
					<Navigator.Screen path="/typography/font-sizes/:origin/:slug">
						<FontSize />
					</Navigator.Screen>
					<Navigator.Screen path="/layout">
						<ScreenLayout />
					</Navigator.Screen>
					<Navigator.Screen path="/colors/palette">
						<ScreenColorPalette />
					</Navigator.Screen>
					<Navigator.Screen path="/variations">
						<ScreenStyleVariations />
					</Navigator.Screen>
					<Navigator.Screen path="/css">
						<ScreenCSS />
					</Navigator.Screen>
					<Navigator.Screen path="/revisions/:revisionId?">
						<ScreenRevisions />
					</Navigator.Screen>
					<Navigator.Screen path="/shadows">
						<ScreenShadows />
					</Navigator.Screen>
					<Navigator.Screen path="/shadows/edit/:category/:slug">
						<ScreenShadowsEdit />
					</Navigator.Screen>
					<Navigator.Screen path="/background">
						<ScreenBackground />
					</Navigator.Screen>
					<Navigator.Screen path="/typography/text">
						<ScreenTypographyElement element="text" />
					</Navigator.Screen>
					<Navigator.Screen path="/typography/link">
						<ScreenTypographyElement element="link" />
					</Navigator.Screen>
					<Navigator.Screen path="/typography/heading">
						<ScreenTypographyElement element="heading" />
					</Navigator.Screen>
					<Navigator.Screen path="/typography/caption">
						<ScreenTypographyElement element="caption" />
					</Navigator.Screen>
					<Navigator.Screen path="/typography/button">
						<ScreenTypographyElement element="button" />
					</Navigator.Screen>
					<Navigator.Screen path="/blocks">
						<ScreenBlockList />
					</Navigator.Screen>
					{ blocks.map( ( block: BlockType ) => (
						<Navigator.Screen
							key={ 'menu-block-' + block.name }
							path={
								'/blocks/' + encodeURIComponent( block.name )
							}
						>
							<ScreenBlock name={ block.name } />
						</Navigator.Screen>
					) ) }

					<ContextScreens />

					{ blocks.map( ( block: BlockType ) => (
						<ContextScreens
							key={ 'screens-block-' + block.name }
							name={ block.name }
							parentMenu={
								'/blocks/' + encodeURIComponent( block.name )
							}
						/>
					) ) }
				</Navigator>
			</BlockEditorProvider>
		</GlobalStylesProvider>
	);
}

/*
 * Component that handles path synchronization between external path prop and Navigator's internal path.
 */
function PathSynchronizer( {
	path,
	onPathChange,
}: {
	path?: string;
	onPathChange?: ( path: string ) => void;
} ) {
	const navigator = useNavigator();
	const { path: childPath } = navigator.location;
	const previousParentPath = usePrevious( path );
	const previousChildPath = usePrevious( childPath );

	useEffect( () => {
		// Only sync when parent and child paths are out of sync
		if ( path && path !== childPath ) {
			// If parent path changed, update the Navigator
			if ( path !== previousParentPath ) {
				navigator.goTo( path );
			}
			// If child path changed, notify parent via onPathChange
			else if ( childPath !== previousChildPath && onPathChange ) {
				onPathChange( childPath ?? '/' );
			}
		}
	}, [
		onPathChange,
		path,
		previousChildPath,
		previousParentPath,
		childPath,
		navigator,
	] );

	// This component only handles synchronization logic. It doesn't render anything.
	// We use it to run the effect inside the Navigator context.
	return null;
}
