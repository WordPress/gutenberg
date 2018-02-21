/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, withFocusReturn } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import { getSidebarSettings } from '../../api/sidebar';
import { getActivePlugin } from '../../store/selectors';
import { closeGeneralSidebar } from '../../store/actions';

function PluginsPanel( { onClose, plugin } ) {
	const pluginSidebar = getSidebarSettings( plugin );

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

export default connect(
	( state ) => {
		return {
			plugin: getActivePlugin( state ),
		};
	}, {
		onClose: closeGeneralSidebar,
	},
	undefined,
	{ storeKey: 'edit-post' }
)( withFocusReturn( PluginsPanel ) );
