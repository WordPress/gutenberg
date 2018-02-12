/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { query } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import { getActivePanel } from '../../store/selectors';
import { toggleSidebar, setActivePanel } from '../../store/actions';

const SidebarHeader = ( { panel, onSetPanel, onToggleSidebar, count } ) => {
	// Do not display "0 Blocks".
	count = count === 0 ? 1 : count;
	const closeSidebar = () => onToggleSidebar( undefined, false );

	return (
		<div className="components-panel__header edit-post-sidebar__panel-tabs">
			<button
				onClick={ () => onSetPanel( 'document' ) }
				className={ `edit-post-sidebar__panel-tab ${ panel === 'document' ? 'is-active' : '' }` }
				aria-label={ __( 'Document settings' ) }
			>
				{ __( 'Document' ) }
			</button>
			<button
				onClick={ () => onSetPanel( 'block' ) }
				className={ `edit-post-sidebar__panel-tab ${ panel === 'block' ? 'is-active' : '' }` }
				aria-label={ __( 'Block settings' ) }
			>
				{ sprintf( _n( 'Block', '%d Blocks', count ), count ) }
			</button>
			<IconButton
				onClick={ closeSidebar }
				icon="no-alt"
				label={ __( 'Close settings' ) }
			/>
		</div>
	);
};

export default compose(
	query( ( select ) => ( {
		count: select( 'core/editor' ).getSelectedBlockCount(),
	} ) ),
	connect(
		( state ) => ( {
			panel: getActivePanel( state ),
		} ),
		{
			onSetPanel: setActivePanel,
			onToggleSidebar: toggleSidebar,
		},
		undefined,
		{ storeKey: 'edit-post' }
	)
)( SidebarHeader );
