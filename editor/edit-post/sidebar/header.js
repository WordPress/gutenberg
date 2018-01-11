/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { getActivePanel, getSelectedBlockCount } from '../../store/selectors';
import { toggleSidebar, setActivePanel } from '../../store/actions';

const SidebarHeader = ( { panel, onSetPanel, onToggleSidebar, count } ) => {
	// Do not display "0 Blocks".
	count = count === 0 ? 1 : count;
	const closeSidebar = () => onToggleSidebar( undefined, false );

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
				aria-label={ __( 'Format settings' ) }
			>
				{ sprintf( _n( 'Format', 'Format (%d)', count ), count ) }
			</button>
			<IconButton
				onClick={ closeSidebar }
				icon="no-alt"
				label={ __( 'Close settings' ) }
			/>
		</div>
	);
};

export default connect(
	( state ) => ( {
		panel: getActivePanel( state ),
		count: getSelectedBlockCount( state ),
	} ),
	{
		onSetPanel: setActivePanel,
		onToggleSidebar: toggleSidebar,
	}
)( SidebarHeader );
