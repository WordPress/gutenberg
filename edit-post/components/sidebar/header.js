/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { BlockCount } from '@wordpress/editor';

/**
 * Internal Dependencies
 */
import { getActivePanel } from '../../store/selectors';
import { toggleSidebar, setActivePanel } from '../../store/actions';

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
			<BlockCount>
				{ ( count ) => {
					// Do not display "0 Blocks".
					count = count === 0 ? 1 : count;

					return (
						<button
							onClick={ () => onSetPanel( 'block' ) }
							className={ `editor-sidebar__panel-tab ${ panel === 'block' ? 'is-active' : '' }` }
							aria-label={ __( 'Block settings' ) }
						>
							{ sprintf( _n( 'Block', '%d Blocks', count ), count ) }
						</button>
					);
				} }
			</BlockCount>
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
