import './style.scss';

/**
 * WordPress dependencies
 */
import { IconButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const SidebarLayout = ( { onClose, title, children } ) => {
	return (
		<div
			className="edit-post-sidebar edit-post-plugins-panel"
			role="region"
			aria-label={ __( 'Editor plugins' ) }
			tabIndex="-1">
			<div className="edit-post-plugins-panel__header">
				<h3>{ title }</h3>
				<IconButton
					onClick={ onClose }
					icon="no-alt"
					label={ __( 'Close settings' ) }
				/>
			</div>
			<div className="edit-post-plugins-panel__content">
				{ children }
			</div>
		</div>
	);
};

export default SidebarLayout;
