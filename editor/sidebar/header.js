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
import { getSidebarMode } from 'editor/selectors';

const SidebarHeader = ( { mode, onSelectMode, toggleSidebar } ) => {
	return (
		<div className="components-panel__header">
			<h2
				onClick={ () => onSelectMode( 'document' ) }
				className={ `editor-sidebar__mode-tab ${ mode === 'document' ? 'is-active' : '' }` }
			>
				{ __( 'Document' ) }
			</h2>
			<h2
				onClick={ () => onSelectMode( 'block' ) }
				className={ `editor-sidebar__mode-tab ${ mode === 'block' ? 'is-active' : '' }` }
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
		mode: getSidebarMode( state ),
	} ),
	( dispatch ) => ( {
		onSelectMode( mode ) {
			dispatch( {
				type: 'SELECT_SIDEBAR_MODE',
				sidebarMode: mode,
			} );
		},
		toggleSidebar: () => dispatch( { type: 'TOGGLE_SIDEBAR' } ),
	} )
)( SidebarHeader );
