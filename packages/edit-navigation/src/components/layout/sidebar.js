/**
 * WordPress dependencies
 */
import { BlockInspector } from '@wordpress/block-editor';
import { Platform } from '@wordpress/element';
import { ComplementaryArea } from '@wordpress/interface';
import { __ } from '@wordpress/i18n';
import { cog } from '@wordpress/icons';

const BLOCK_INSPECTOR_IDENTIFIER = 'edit-widgets/block-inspector';

const SIDEBAR_ACTIVE_BY_DEFAULT = Platform.select( {
	web: true,
	native: false,
} );

export default function Sidebar() {
	return (
		<ComplementaryArea
			className="edit-navigation-sidebar"
			/* translators: button label text should, if possible, be under 16 characters. */
			title={ __( 'Settings' ) }
			closeLabel={ __( 'Close settings' ) }
			scope="core/edit-navigation"
			identifier={ BLOCK_INSPECTOR_IDENTIFIER }
			icon={ cog }
			isActiveByDefault={ SIDEBAR_ACTIVE_BY_DEFAULT }
			header={ <></> }
		>
			<BlockInspector />
		</ComplementaryArea>
	);
}
