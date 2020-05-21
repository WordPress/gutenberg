/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ComplementaryArea } from '@wordpress/interface';
import { BlockInspector } from '@wordpress/block-editor';
import { cog } from '@wordpress/icons';

export default function Sidebar() {
	return (
		<ComplementaryArea
			className="edit-widgets-sidebar"
			smallScreenTitle={ __( 'Widget Areas' ) }
			scope="core/edit-widgets"
			complementaryAreaIdentifier="edit-widgets/block-inspector"
			title={ __( 'Block' ) }
			icon={ cog }
		>
			<BlockInspector showNoBlockSelectedMessage={ false } />
		</ComplementaryArea>
	);
}
