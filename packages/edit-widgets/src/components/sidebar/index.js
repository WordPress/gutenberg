/**
 * WordPress dependencies
 */
import { Panel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function Sidebar() {
	return (
		<div
			className="edit-widgets-sidebar"
			role="region"
			aria-label={ __( 'Widgets advanced settings' ) }
			tabIndex="-1"
		>
			<Panel header={ __( 'Block Areas' ) } />
		</div>
	);
}

export default Sidebar;
