/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { ComplementaryArea } from '@wordpress/interface';
import { __ } from '@wordpress/i18n';
import { cog, pencil } from '@wordpress/icons';
import { Platform } from '@wordpress/element';

const { Slot: InspectorSlot, Fill: InspectorFill } = createSlotFill(
	'EditSiteSidebarInspector'
);
export const SidebarInspectorFill = InspectorFill;
const BLOCK_INSPECTOR_ACTIVE_BY_DEFAULT = Platform.select( {
	web: true,
	native: false,
} );
export function SidebarComplementaryAreaFills() {
	return (
		<>
			<ComplementaryArea
				scope="core/edit-site"
				identifier="edit-site/block-inspector"
				title={ __( 'Block Inspector' ) }
				icon={ cog }
				isActiveByDefault={ BLOCK_INSPECTOR_ACTIVE_BY_DEFAULT }
			>
				<InspectorSlot bubblesVirtually />
			</ComplementaryArea>
			<ComplementaryArea
				scope="core/edit-site"
				identifier="edit-site/global-styles"
				title={ __( 'Global Styles' ) }
				icon={ pencil }
			>
				<p>Global Styles area</p>
			</ComplementaryArea>
		</>
	);
}
