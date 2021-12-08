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
import { useHasDimensionsPanel } from './dimensions-panel';
import { useHasTypographyPanel } from './typography-panel';
import { NavigationButton } from './navigation-button';

function ContextMenu( { name, parentMenu = '' } ) {
	const hasTypographyPanel = useHasTypographyPanel( name );
	const hasColorPanel = useHasColorPanel( name );
	const hasBorderPanel = useHasBorderPanel( name );
	const hasDimensionsPanel = useHasDimensionsPanel( name );
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

export default ContextMenu;
