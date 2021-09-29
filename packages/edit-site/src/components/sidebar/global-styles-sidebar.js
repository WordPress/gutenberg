/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getBlockType } from '@wordpress/blocks';
import { layout, color, styles, typography } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	useGlobalStylesContext,
	useGlobalStylesReset,
} from '../editor/global-styles-provider';
import DefaultSidebar from './default-sidebar';
import {
	default as TypographyPanel,
	useHasTypographyPanel,
} from './typography-panel';
import { default as BorderPanel, useHasBorderPanel } from './border-panel';
import { default as ColorPanel, useHasColorPanel } from './color-panel';
import ColorPalettePanel from './color-palette-panel';
import {
	default as DimensionsPanel,
	useHasDimensionsPanel,
} from './dimensions-panel';
import { StylePreview } from './global-styles/preview';
import NavigationButton from './global-styles/navigation-button';
import ScreenHeader from './global-styles/screen-header';

function getPanelTitle( blockName ) {
	const blockType = getBlockType( blockName );

	// Protect against blocks that aren't registered
	// eg: widget-area
	if ( blockType === undefined ) {
		return blockName;
	}

	return blockType.title;
}

function GlobalStylesLevelMenu( { context, parentMenu = '' } ) {
	const hasTypographyPanel = useHasTypographyPanel( context );
	const hasColorPanel = useHasColorPanel( context );
	const hasBorderPanel = useHasBorderPanel( context );
	const hasDimensionsPanel = useHasDimensionsPanel( context );
	const hasLayoutPanel = hasBorderPanel || hasDimensionsPanel;

	return (
		<ItemGroup>
			{ hasTypographyPanel && (
				<NavigationButton
					icon={ typography }
					path={ parentMenu + '/typography' }
				>
					{ __( 'Typography' ) }
				</NavigationButton>
			) }
			{ hasColorPanel && (
				<NavigationButton
					icon={ color }
					path={ parentMenu + '/colors' }
				>
					{ __( 'Colors' ) }
				</NavigationButton>
			) }
			{ hasLayoutPanel && (
				<NavigationButton
					icon={ layout }
					path={ parentMenu + '/layout' }
				>
					{ __( 'Layout' ) }
				</NavigationButton>
			) }
		</ItemGroup>
	);
}

function GlobalStylesLevelScreens( {
	context,
	getStyle,
	setStyle,
	getSetting,
	setSetting,
	parentMenu = '',
} ) {
	const hasTypographyPanel = useHasTypographyPanel( context );
	const hasColorPanel = useHasColorPanel( context );
	const hasBorderPanel = useHasBorderPanel( context );
	const hasDimensionsPanel = useHasDimensionsPanel( context );
	const hasLayoutPanel = hasBorderPanel || hasDimensionsPanel;

	return (
		<>
			{ hasTypographyPanel && (
				<NavigatorScreen path={ parentMenu + '/typography' }>
					<ScreenHeader
						back={ parentMenu ? parentMenu : '/' }
						title={ __( 'Typography' ) }
					/>
					<TypographyPanel
						context={ context }
						getStyle={ getStyle }
						setStyle={ setStyle }
					/>
				</NavigatorScreen>
			) }

			{ hasColorPanel && (
				<NavigatorScreen path={ parentMenu + '/colors' }>
					<ScreenHeader
						back={ parentMenu ? parentMenu : '/' }
						title={ __( 'Colors' ) }
						description={ __(
							'Manage the color palette and how it applies to the elements of your site'
						) }
					/>
					<ColorPanel
						context={ context }
						getStyle={ getStyle }
						setStyle={ setStyle }
					/>
				</NavigatorScreen>
			) }

			{ hasColorPanel && (
				<NavigatorScreen path={ parentMenu + '/colors/palette' }>
					<ScreenHeader
						back={ parentMenu + '/colors' }
						title={ __( 'Color Palette' ) }
						description={ __(
							'Manage the color palette of your site'
						) }
					/>
					<ColorPalettePanel
						contextName={ context.name }
						getSetting={ getSetting }
						setSetting={ setSetting }
					/>
				</NavigatorScreen>
			) }

			{ hasLayoutPanel && (
				<NavigatorScreen path={ parentMenu + '/layout' }>
					<ScreenHeader
						back={ parentMenu ? parentMenu : '/' }
						title={ __( 'Layout' ) }
					/>
					{ hasDimensionsPanel && (
						<DimensionsPanel
							context={ context }
							getStyle={ getStyle }
							setStyle={ setStyle }
						/>
					) }
					{ hasBorderPanel && (
						<BorderPanel
							context={ context }
							getStyle={ getStyle }
							setStyle={ setStyle }
						/>
					) }
				</NavigatorScreen>
			) }
		</>
	);
}

export default function GlobalStylesSidebar() {
	const {
		root,
		blocks,
		getStyle,
		setStyle,
		getSetting,
		setSetting,
	} = useGlobalStylesContext();

	const [ canRestart, onReset ] = useGlobalStylesReset();

	return (
		<DefaultSidebar
			className="edit-site-global-styles-sidebar"
			identifier="edit-site/global-styles"
			title={ __( 'Styles' ) }
			icon={ styles }
			closeLabel={ __( 'Close global styles sidebar' ) }
			header={
				<>
					<strong>{ __( 'Styles' ) }</strong>
					<Button
						className="edit-site-global-styles-sidebar__reset-button"
						isSmall
						variant="tertiary"
						disabled={ ! canRestart }
						onClick={ onReset }
					>
						{ __( 'Reset to defaults' ) }
					</Button>
				</>
			}
		>
			<NavigatorProvider initialPath="/">
				<NavigatorScreen path="/">
					<StylePreview />

					<GlobalStylesLevelMenu context={ root } />

					<ItemGroup>
						<Item>
							<p>
								{ __(
									'Customize the appearance of specific blocks for the whole site'
								) }
							</p>
						</Item>
						<NavigationButton path="/blocks">
							{ __( 'Blocks' ) }
						</NavigationButton>
					</ItemGroup>
				</NavigatorScreen>

				<NavigatorScreen path="/blocks">
					<ScreenHeader back="/" title={ __( 'Blocks' ) } />
					{ map( blocks, ( _, name ) => (
						<NavigationButton
							path={ '/blocks/' + name }
							key={ 'menu-itemblock-' + name }
						>
							{ getPanelTitle( name ) }
						</NavigationButton>
					) ) }
				</NavigatorScreen>

				{ map( blocks, ( block, name ) => (
					<NavigatorScreen
						key={ 'menu-block-' + name }
						path={ '/blocks/' + name }
					>
						<ScreenHeader
							back="/blocks"
							title={ getPanelTitle( name ) }
						/>
						<GlobalStylesLevelMenu
							parentMenu={ '/blocks/' + name }
							context={ block }
						/>
					</NavigatorScreen>
				) ) }

				<GlobalStylesLevelScreens
					context={ root }
					getStyle={ getStyle }
					setStyle={ setStyle }
					getSetting={ getSetting }
					setSetting={ setSetting }
				/>

				{ map( blocks, ( block, name ) => (
					<GlobalStylesLevelScreens
						key={ 'screens-block-' + name }
						parentMenu={ '/blocks/' + name }
						context={ block }
						getStyle={ getStyle }
						setStyle={ setStyle }
						getSetting={ getSetting }
						setSetting={ setSetting }
					/>
				) ) }
			</NavigatorProvider>
		</DefaultSidebar>
	);
}
