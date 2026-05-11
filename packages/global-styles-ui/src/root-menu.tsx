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
// @ts-expect-error: Not typed yet.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import type { GlobalStylesSettings } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { NavigationButtonAsItem } from './navigation-button';
import { useSetting } from './hooks';
import { unlock } from './lock-unlock';

const {
	useHasDimensionsPanel,
	useHasTypographyPanel,
	useHasColorPanel,
	useSettingsForBlockElement,
	useHasBackgroundPanel,
} = unlock( blockEditorPrivateApis );

function RootMenu() {
	// Get the raw settings from our custom hook
	const [ rawSettings ] = useSetting< GlobalStylesSettings >( '' );

	// Process settings the same way as Gutenberg
	const settings = useSettingsForBlockElement( rawSettings );

	// Use the same panel detection logic as Gutenberg
	const hasBackgroundPanel = useHasBackgroundPanel( rawSettings );
	const hasTypographyPanel = useHasTypographyPanel( settings );
	const hasColorPanel = useHasColorPanel( settings );
	const hasShadowPanel = true; // Same as Gutenberg
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
