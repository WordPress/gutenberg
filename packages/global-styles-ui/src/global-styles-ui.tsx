/**
 * WordPress dependencies
 */
import { Navigator, useNavigator } from '@wordpress/components';
// @ts-expect-error: Not typed yet.
import { getBlockTypes, store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
// @ts-expect-error: Not typed yet.
import { BlockEditorProvider } from '@wordpress/block-editor';
import { useMemo, useEffect, Fragment } from '@wordpress/element';
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

interface GlobalStylesNavigationScreenProps {
	path: string;
	children: React.ReactNode;
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

	if ( ! blockStyleVariations?.length ) {
		return null;
	}

	return (
		<BlockStylesNavigationScreens
			parentMenu={ parentMenu }
			blockStyles={ blockStyleVariations }
			blockName={ name || '' }
		/>
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

	const [ globalStylesCSS, globalSettings ] = generateGlobalStyles(
		mergedValue,
		[],
		{
			styleOptions: { variationStyles: true },
		}
	);
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
					<GlobalStylesNavigationScreen path="/">
						<ScreenRoot />
					</GlobalStylesNavigationScreen>
					<GlobalStylesNavigationScreen path="/colors">
						<ScreenColors />
					</GlobalStylesNavigationScreen>
					<GlobalStylesNavigationScreen path="/typography">
						<ScreenTypography />
					</GlobalStylesNavigationScreen>
					<GlobalStylesNavigationScreen path="/typography/font-sizes">
						<FontSizes />
					</GlobalStylesNavigationScreen>
					<GlobalStylesNavigationScreen path="/typography/font-sizes/:origin/:slug">
						<FontSize />
					</GlobalStylesNavigationScreen>
					<GlobalStylesNavigationScreen path="/layout">
						<ScreenLayout />
					</GlobalStylesNavigationScreen>
					<GlobalStylesNavigationScreen path="/colors/palette">
						<ScreenColorPalette />
					</GlobalStylesNavigationScreen>
					<GlobalStylesNavigationScreen path="/variations">
						<ScreenStyleVariations />
					</GlobalStylesNavigationScreen>
					<GlobalStylesNavigationScreen path="/css">
						<ScreenCSS />
					</GlobalStylesNavigationScreen>
					<GlobalStylesNavigationScreen path="/revisions/:revisionId?">
						<ScreenRevisions />
					</GlobalStylesNavigationScreen>
					<GlobalStylesNavigationScreen path="/shadows">
						<ScreenShadows />
					</GlobalStylesNavigationScreen>
					<GlobalStylesNavigationScreen path="/shadows/edit/:category/:slug">
						<ScreenShadowsEdit />
					</GlobalStylesNavigationScreen>
					<GlobalStylesNavigationScreen path="/background">
						<ScreenBackground />
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
					<GlobalStylesNavigationScreen path="/blocks">
						<ScreenBlockList />
					</GlobalStylesNavigationScreen>
					{ blocks.map( ( block: BlockType ) => (
						<Fragment key={ block.name }>
							<GlobalStylesNavigationScreen
								path={
									'/blocks/' +
									encodeURIComponent( block.name )
								}
							>
								<ScreenBlock name={ block.name } />
							</GlobalStylesNavigationScreen>
							<ContextScreens
								name={ block.name }
								parentMenu={
									'/blocks/' +
									encodeURIComponent( block.name )
								}
							/>
						</Fragment>
					) ) }
				</Navigator>
			</BlockEditorProvider>
		</GlobalStylesProvider>
	);
}

function GlobalStylesNavigationScreen( {
	path,
	children,
}: GlobalStylesNavigationScreenProps ) {
	return (
		<Navigator.Screen
			className="global-styles-ui-sidebar__navigator-screen"
			path={ path }
		>
			{ children }
		</Navigator.Screen>
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
