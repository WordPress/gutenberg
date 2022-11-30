/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { typography, color, layout } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useHasBorderPanel } from './border-panel';
import { useHasColorPanel } from './color-utils';
import { useHasShadowPanel } from './shadows-panel';
import { useHasDimensionsPanel } from './dimensions-panel';
import { useHasTypographyPanel } from './typography-panel';
import { NavigationButtonAsItem } from './navigation-button';

function ContextMenu( { name, parentMenu = '' } ) {
	const hasTypographyPanel = useHasTypographyPanel( name );
	const hasColorPanel = useHasColorPanel( name );
	const hasShadowPanel = useHasShadowPanel( name );
	const hasBorderPanel = useHasBorderPanel( name );
	const hasDimensionsPanel = useHasDimensionsPanel( name );
	const hasLayoutPanel = hasBorderPanel || hasDimensionsPanel;

	return (
		<ItemGroup>
			{ hasTypographyPanel && (
				<NavigationButtonAsItem
					icon={ typography }
					path={ parentMenu + '/typography' }
					aria-label={ __( 'Typography styles' ) }
				>
					{ __( 'Typography' ) }
				</NavigationButtonAsItem>
			) }
			{ hasColorPanel && (
				<NavigationButtonAsItem
					icon={ color }
					path={ parentMenu + '/colors' }
					aria-label={ __( 'Colors styles' ) }
				>
					{ __( 'Colors' ) }
				</NavigationButtonAsItem>
			) }
			{ hasShadowPanel && (
				<NavigationButtonAsItem
					icon={ color }
					path={ parentMenu + '/shadows' }
					aria-label={ __( 'Shadow styles' ) }
				>
					{ __( 'Shadows' ) }
				</NavigationButtonAsItem>
			) }
			{ hasLayoutPanel && (
				<NavigationButtonAsItem
					icon={ layout }
					path={ parentMenu + '/layout' }
					aria-label={ __( 'Layout styles' ) }
				>
					{ __( 'Layout' ) }
				</NavigationButtonAsItem>
			) }
		</ItemGroup>
	);
}

export default ContextMenu;
