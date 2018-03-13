/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, withFocusReturn } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import './style.scss';
import { getSidebarSettings } from '../../api/sidebar';

function PluginsPanel( { onClose, pluginSidebar } ) {
	if ( ! pluginSidebar ) {
		return null;
	}

	const {
		title,
		render,
	} = pluginSidebar;

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
				{ render() }
			</div>
		</div>
	);
}

export default compose(
	withSelect( ( select ) => ( {
		pluginSidebar: getSidebarSettings( select( 'core/edit-post' ).getActiveGeneralSidebarName() ),
	} ) ),
	withDispatch( ( dispatch ) => ( {
		onClose: dispatch( 'core/edit-post' ).closeGeneralSidebar,
	} ) ),
	withFocusReturn,
)( PluginsPanel );
