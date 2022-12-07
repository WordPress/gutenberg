/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { typography, border, color, layout } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useHasBorderPanel } from './border-panel';
import { useHasColorPanel } from './color-utils';
import { useHasDimensionsPanel } from './dimensions-panel';
import { useHasTypographyPanel } from './typography-panel';
import { useHasVariationsPanel } from './variations-panel';
import { NavigationButtonAsItem } from './navigation-button';

function ContextMenu( { name, parentMenu = '' } ) {
	const hasTypographyPanel = useHasTypographyPanel( name );
	const hasColorPanel = useHasColorPanel( name );
	const hasBorderPanel = useHasBorderPanel( name );
	const hasDimensionsPanel = useHasDimensionsPanel( name );
	const hasLayoutPanel = hasDimensionsPanel;
	const hasVariationsPanel = useHasVariationsPanel( name, parentMenu );

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
			{ hasBorderPanel && (
				<NavigationButtonAsItem
					icon={ border }
					path={ parentMenu + '/border' }
					aria-label={ __( 'Border styles' ) }
				>
					{ __( 'Border' ) }
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
			{ hasVariationsPanel && (
				<NavigationButtonAsItem
					icon={ '+' }
					path={ parentMenu + '/variations' }
					aria-label={ __( 'Style variations' ) }
				>
					{ __( 'Variations' ) }
				</NavigationButtonAsItem>
			) }
		</ItemGroup>
	);
}

export default ContextMenu;
