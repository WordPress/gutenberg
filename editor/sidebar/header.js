/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { getActivePanel } from '../selectors';
import { toggleSidebar, setActivePanel } from '../actions';

const SidebarHeader = ( { panel, onSetPanel, onToggleSidebar } ) => {
	return (
		<div className="components-panel__header editor-sidebar__panel-tabs">
			<button
				onClick={ () => onSetPanel( 'document' ) }
				className={ `editor-sidebar__panel-tab ${ panel === 'document' ? 'is-active' : '' }` }
				aria-label={ __( 'Document settings' ) }
			>
				{ __( 'Document' ) }
			</button>
			<button
				onClick={ () => onSetPanel( 'block' ) }
				className={ `editor-sidebar__panel-tab ${ panel === 'block' ? 'is-active' : '' }` }
				aria-label={ __( 'Block settings' ) }
			>
				{ __( 'Block' ) }
			</button>
			<IconButton
				onClick={ onToggleSidebar }
				icon="no-alt"
				label={ __( 'Close settings' ) }
			/>
		</div>
	);
};

export default connect(
	( state ) => ( {
		panel: getActivePanel( state ),
	} ),
	( dispatch ) => ( {
		onSetPanel: ( panel ) => dispatch( setActivePanel( panel ) ),
		onToggleSidebar: () => dispatch( toggleSidebar() ),
	} )
)( SidebarHeader );
