/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalNavigator as Navigator,
	__experimentalNavigatorScreen as NavigatorScreen,
	__experimentalUseNavigator as useNavigator,
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	FlexItem,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalSpacer as Spacer,
	__experimentalHeading as Heading,
	__experimentalView as View,
} from '@wordpress/components';
import { __, isRTL } from '@wordpress/i18n';
import { getBlockType } from '@wordpress/blocks';
import {
	Icon,
	layout,
	brush,
	styles,
	typography,
	chevronLeft,
	chevronRight,
} from '@wordpress/icons';

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
import {
	default as DimensionsPanel,
	useHasDimensionsPanel,
} from './dimensions-panel';
import { StylePreview } from './global-styles/preview';

function getPanelTitle( blockName ) {
	const blockType = getBlockType( blockName );

	// Protect against blocks that aren't registered
	// eg: widget-area
	if ( blockType === undefined ) {
		return blockName;
	}

	return blockType.title;
}

const ScreenHeader = ( { back, title } ) => {
	return (
		<VStack spacing={ 5 }>
			<HStack spacing={ 2 }>
				<View>
					<NavigationButton
						path={ back }
						icon={
							<Icon
								icon={ isRTL() ? chevronRight : chevronLeft }
								variant="muted"
							/>
						}
						size="small"
						isBack
					/>
				</View>
				<Spacer>
					<Heading level={ 5 }>{ title }</Heading>
				</Spacer>
			</HStack>
		</VStack>
	);
};

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
					icon={ brush }
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
					/>
					<ColorPanel
						context={ context }
						getStyle={ getStyle }
						setStyle={ setStyle }
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

function NavigationButton( {
	path,
	icon,
	children,
	isBack = false,
	...props
} ) {
	const navigator = useNavigator();
	return (
		<Item
			isAction
			onClick={ () => navigator.push( path, { isBack } ) }
			{ ...props }
		>
			<HStack justify="flex-start">
				{ icon && (
					<FlexItem>
						<Icon icon={ icon } size={ 24 } />
					</FlexItem>
				) }
				<FlexItem>{ children }</FlexItem>
			</HStack>
		</Item>
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
			<Navigator initialPath="/">
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
			</Navigator>
		</DefaultSidebar>
	);
}
