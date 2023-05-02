/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import {
	typography,
	border,
	filter,
	shadow,
	color,
	layout,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { NavigationButtonAsItem } from './navigation-button';
import { unlock } from '../../private-apis';

const {
	useHasDimensionsPanel,
	useHasTypographyPanel,
	useHasBorderPanel,
	useHasColorPanel,
	useHasEffectsPanel,
	useHasFiltersPanel,
	useGlobalSetting,
	useSettingsForBlockElement,
} = unlock( blockEditorPrivateApis );

function RootMenu() {
	const [ rawSettings ] = useGlobalSetting( '' );
	const settings = useSettingsForBlockElement( rawSettings );
	const hasTypographyPanel = useHasTypographyPanel( settings );
	const hasColorPanel = useHasColorPanel( settings );
	const hasBorderPanel = useHasBorderPanel( settings );
	const hasEffectsPanel = useHasEffectsPanel( settings );
	const hasFilterPanel = useHasFiltersPanel( settings );
	const hasDimensionsPanel = useHasDimensionsPanel( settings );
	const hasLayoutPanel = hasDimensionsPanel;

	return (
		<>
			<ItemGroup>
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
				{ hasBorderPanel && (
					<NavigationButtonAsItem
						icon={ border }
						path="/border"
						aria-label={ __( 'Border' ) }
					>
						{ __( 'Border' ) }
					</NavigationButtonAsItem>
				) }
				{ hasEffectsPanel && (
					<NavigationButtonAsItem
						icon={ shadow }
						path="/effects"
						aria-label={ __( 'Effects' ) }
					>
						{ __( 'Effects' ) }
					</NavigationButtonAsItem>
				) }
				{ hasFilterPanel && (
					<NavigationButtonAsItem
						icon={ filter }
						path="/filters"
						aria-label={ __( 'Filters styles' ) }
					>
						{ __( 'Filters' ) }
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
