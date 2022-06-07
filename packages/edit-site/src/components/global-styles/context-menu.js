/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import {
	brush,
	blockDefault,
	typography,
	color,
	layout,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useHasBorderPanel } from './border-panel';
import { useHasColorPanel } from './color-utils';
import { useHasDimensionsPanel } from './dimensions-panel';
import { useHasTypographyPanel } from './typography-panel';
import { NavigationButtonAsItem } from './navigation-button';

function ContextMenu( { name, parentMenu = '' } ) {
	const hasTypographyPanel = useHasTypographyPanel( name );
	const hasColorPanel = useHasColorPanel( name );
	const hasBorderPanel = useHasBorderPanel( name );
	const hasDimensionsPanel = useHasDimensionsPanel( name );
	const hasLayoutPanel = hasBorderPanel || hasDimensionsPanel;
	const { variations } = useSelect( ( select ) => {
		return {
			variations: select(
				coreStore
			).__experimentalGetCurrentThemeGlobalStylesVariations(),
		};
	}, [] );

	return (
		<ItemGroup>
			{ hasTypographyPanel && (
				<NavigationButtonAsItem
					icon={ typography }
					path={ parentMenu + '/typography' }
				>
					{ __( 'Typography' ) }
				</NavigationButtonAsItem>
			) }
			{ hasColorPanel && (
				<NavigationButtonAsItem
					icon={ color }
					path={ parentMenu + '/colors' }
				>
					{ __( 'Colors' ) }
				</NavigationButtonAsItem>
			) }
			{ hasLayoutPanel && (
				<NavigationButtonAsItem
					icon={ layout }
					path={ parentMenu + '/layout' }
				>
					{ __( 'Layout' ) }
				</NavigationButtonAsItem>
			) }
			{ !! variations?.length && (
				<NavigationButtonAsItem path="/variations" icon={ brush }>
					{ __( 'Browse styles' ) }
				</NavigationButtonAsItem>
			) }
			<NavigationButtonAsItem path="/blocks" icon={ blockDefault }>
				{ __( 'Blocks' ) }
			</NavigationButtonAsItem>
		</ItemGroup>
	);
}

export default ContextMenu;
