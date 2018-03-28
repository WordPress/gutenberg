/**
 * WordPress dependencies
 */
import { IconButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

const SidebarLayout = ( { onClose, title, children } ) => {
	return (
		<div
			className="edit-post-plugin-sidebar__sidebar-layout"
			role="region"
			aria-label={ __( 'Editor plugins' ) }
			tabIndex="-1">
			<div className="edit-post-plugin-sidebar__sidebar-layout__header">
				<h3 className="edit-post-plugin-sidebar__sidebar-layout__title">{ title }</h3>
				<IconButton
					onClick={ onClose }
					icon="no-alt"
					label={ __( 'Close settings' ) }
				/>
			</div>
			<div className="edit-post-plugin-sidebar__sidebar-layout__content">
				{ children }
			</div>
		</div>
	);
};

export default SidebarLayout;
