/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalNavigation as Navigation,
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationMenu as NavigationMenu,
	__experimentalNavigationGroup as NavigationGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getBlockType } from '@wordpress/blocks';
import { layout, brush, styles, typography } from '@wordpress/icons';

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

function GlobalStylesLevel( {
	context,
	getStyle,
	setStyle,
	getSetting,
	setSetting,
	parentMenu = 'root',
} ) {
	const hasTypographyPanel = useHasTypographyPanel( context );
	const hasColorPanel = useHasColorPanel( context );
	const hasBorderPanel = useHasBorderPanel( context );
	const hasDimensionsPanel = useHasDimensionsPanel( context );
	const hasLayoutPanel = hasBorderPanel || hasDimensionsPanel;

	return (
		<>
			<NavigationGroup>
				{ hasTypographyPanel && (
					<NavigationItem
						item="item-typography"
						navigateToMenu={ parentMenu + '.typography' }
						icon={ typography }
						title={ __( 'Typography' ) }
					/>
				) }
				{ hasColorPanel && (
					<NavigationItem
						item="item-color"
						navigateToMenu={ parentMenu + '.color' }
						title={ __( 'Colors' ) }
						icon={ brush }
					/>
				) }
				{ hasLayoutPanel && (
					<NavigationItem
						item="item-layout"
						navigateToMenu={ parentMenu + '.layout' }
						title={ __( 'Layout' ) }
						icon={ layout }
					/>
				) }
			</NavigationGroup>

			{ hasTypographyPanel && (
				<NavigationMenu
					menu={ parentMenu + '.typography' }
					parentMenu={ parentMenu }
					title={ __( 'Typography' ) }
				>
					<NavigationItem>
						<TypographyPanel
							context={ context }
							getStyle={ getStyle }
							setStyle={ setStyle }
						/>
					</NavigationItem>
				</NavigationMenu>
			) }

			{ hasColorPanel && (
				<NavigationMenu
					menu={ parentMenu + '.color' }
					parentMenu={ parentMenu }
					title={ __( 'Colors' ) }
				>
					<NavigationItem>
						<ColorPanel
							context={ context }
							getStyle={ getStyle }
							setStyle={ setStyle }
							getSetting={ getSetting }
							setSetting={ setSetting }
						/>
					</NavigationItem>
				</NavigationMenu>
			) }

			{ hasLayoutPanel && (
				<NavigationMenu
					menu={ parentMenu + '.layout' }
					parentMenu={ parentMenu }
				>
					<NavigationItem>
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
					</NavigationItem>
				</NavigationMenu>
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
			<Navigation>
				<NavigationMenu>
					<NavigationGroup>
						<NavigationItem>
							<StylePreview />
						</NavigationItem>
					</NavigationGroup>
					<GlobalStylesLevel
						context={ root }
						getStyle={ getStyle }
						setStyle={ setStyle }
						getSetting={ getSetting }
						setSetting={ setSetting }
					/>
					<NavigationGroup className="edit-site-global-styles-sidebar__blocks-group">
						<NavigationItem
							className="edit-site-global-styles-sidebar__blocks-group-help"
							isText
						>
							{ __(
								'Customize the appearance of specific blocks for the whole site'
							) }
						</NavigationItem>
						<NavigationItem
							item="item-blocks"
							navigateToMenu="blocks"
							title={ __( 'Blocks' ) }
						/>
					</NavigationGroup>
				</NavigationMenu>
				<NavigationMenu
					menu="blocks"
					parentMenu="root"
					title={ __( 'Blocks' ) }
				>
					{ map( blocks, ( _, name ) => (
						<NavigationItem
							key={ 'menu-itemblock-' + name }
							item={ 'block-' + name }
							navigateToMenu={ 'block-' + name }
							title={ getPanelTitle( name ) }
						/>
					) ) }
				</NavigationMenu>
				{ map( blocks, ( block, name ) => (
					<NavigationMenu
						key={ 'menu-block-' + name }
						menu={ 'block-' + name }
						parentMenu="blocks"
						title={ getPanelTitle( name ) }
					>
						<GlobalStylesLevel
							parentMenu={ 'block-' + name }
							context={ block }
							getStyle={ getStyle }
							setStyle={ setStyle }
							getSetting={ getSetting }
							setSetting={ setSetting }
						/>
					</NavigationMenu>
				) ) }
			</Navigation>
		</DefaultSidebar>
	);
}
