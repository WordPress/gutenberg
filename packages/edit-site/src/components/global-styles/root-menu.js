/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import {
	background,
	typography,
	color,
	layout,
	shadow as shadowIcon,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { NavigationButtonAsItem } from './navigation-button';
import { unlock } from '../../lock-unlock';

const {
	useHasDimensionsPanel,
	useHasTypographyPanel,
	useHasColorPanel,
	useGlobalSetting,
	useSettingsForBlockElement,
	useHasBackgroundPanel,
} = unlock( blockEditorPrivateApis );

function RootMenu() {
	const [ rawSettings ] = useGlobalSetting( '' );
	const settings = useSettingsForBlockElement( rawSettings );
	/*
	 * Use the raw settings to determine if the background panel should be displayed,
	 * as the background panel is not dependent on the block element settings.
	 */
	const hasBackgroundPanel = useHasBackgroundPanel( rawSettings );
	const hasTypographyPanel = useHasTypographyPanel( settings );
	const hasColorPanel = useHasColorPanel( settings );
	const hasShadowPanel = true; // useHasShadowPanel( settings );
	const hasDimensionsPanel = useHasDimensionsPanel( settings );
	const hasLayoutPanel = hasDimensionsPanel;

	return (
		<>
			<ItemGroup>
				{ hasTypographyPanel && (
					<NavigationButtonAsItem
						icon={ typography }
						path="/typography"
					>
						{ __( 'Typography' ) }
					</NavigationButtonAsItem>
				) }
				{ hasColorPanel && (
					<NavigationButtonAsItem icon={ color } path="/colors">
						{ __( 'Colors' ) }
					</NavigationButtonAsItem>
				) }
				{ hasBackgroundPanel && (
					<NavigationButtonAsItem
						icon={ background }
						path="/background"
						aria-label={ __( 'Background styles' ) }
					>
						{ __( 'Background' ) }
					</NavigationButtonAsItem>
				) }
				{ hasShadowPanel && (
					<NavigationButtonAsItem icon={ shadowIcon } path="/shadows">
						{ __( 'Shadows' ) }
					</NavigationButtonAsItem>
				) }
				{ hasLayoutPanel && (
					<NavigationButtonAsItem icon={ layout } path="/layout">
						{ __( 'Layout' ) }
					</NavigationButtonAsItem>
				) }
			</ItemGroup>
		</>
	);
}

export default RootMenu;
