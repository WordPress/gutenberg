/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { IconButton } from 'components';

/**
 * Internal Dependencies
 */
import { getActivePanel } from 'editor/selectors';

const SidebarHeader = ( { panel, onSetPanel, toggleSidebar } ) => {
	return (
		<div className="components-panel__header">
			<h2
				onClick={ () => onSetPanel( 'document' ) }
				className={ `editor-sidebar__mode-tab ${ panel === 'document' ? 'is-active' : '' }` }
			>
				{ __( 'Document' ) }
			</h2>
			<h2
				onClick={ () => onSetPanel( 'block' ) }
				className={ `editor-sidebar__mode-tab ${ panel === 'block' ? 'is-active' : '' }` }
			>
				{ __( 'Block' ) }
			</h2>
			<IconButton
				onClick={ toggleSidebar }
				icon="no-alt"
				label={ __( 'Close post settings sidebar' ) }
			/>
		</div>
	);
};

export default connect(
	( state ) => ( {
		panel: getActivePanel( state ),
	} ),
	( dispatch ) => ( {
		onSetPanel( panel ) {
			dispatch( {
				type: 'SET_ACTIVE_PANEL',
				panel: panel,
			} );
		},
		toggleSidebar: () => dispatch( { type: 'TOGGLE_SIDEBAR' } ),
	} )
)( SidebarHeader );
