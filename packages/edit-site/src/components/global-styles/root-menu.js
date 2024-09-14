/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import {
	typography,
	background,
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
	const hasTypographyPanel = useHasTypographyPanel( settings );
	const hasColorPanel = useHasColorPanel( settings );
	const hasShadowPanel = true; // useHasShadowPanel( settings );
	const hasDimensionsPanel = useHasDimensionsPanel( settings );
	const hasLayoutPanel = hasDimensionsPanel;
	const hasBackgroundPanel = useHasBackgroundPanel( settings );

	return (
		<>
			<ItemGroup>
				{ hasBackgroundPanel && (
					<NavigationButtonAsItem
						icon={ background }
						path="/background"
						aria-label={ __( 'Background styles' ) }
					>
						{ __( 'Background' ) }
					</NavigationButtonAsItem>
				) }
				{ hasTypographyPanel && (
					<NavigationButtonAsItem
						icon={ typography }
						path="/typography"
						aria-label={ __( 'Typography styles' ) }
					>
						{ __( 'Typography' ) }
					</NavigationButtonAsItem>
				) }
				{ hasColorPanel && (
					<NavigationButtonAsItem
						icon={ color }
						path="/colors"
						aria-label={ __( 'Colors styles' ) }
					>
						{ __( 'Colors' ) }
					</NavigationButtonAsItem>
				) }
				{ hasShadowPanel && (
					<NavigationButtonAsItem
						icon={ shadowIcon }
						path="/shadows"
						aria-label={ __( 'Shadow styles' ) }
					>
						{ __( 'Shadows' ) }
					</NavigationButtonAsItem>
				) }
				{ hasLayoutPanel && (
					<NavigationButtonAsItem
						icon={ layout }
						path="/layout"
						aria-label={ __( 'Layout styles' ) }
					>
						{ __( 'Layout' ) }
					</NavigationButtonAsItem>
				) }
			</ItemGroup>
		</>
	);
}

export default RootMenu;
