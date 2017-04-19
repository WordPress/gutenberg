/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import './style.scss';
import Dashicon from '../../components/dashicon';
import IconButton from '../../components/icon-button';
import Inserter from '../../components/inserter';
import Button from '../../components/button';

function Tools( { undo, redo, hasUndo, hasRedo, isSidebarOpened, toggleSidebar } ) {
	return (
		<div className="editor-tools">
			<IconButton
				icon="undo"
				label={ wp.i18n.__( 'Undo' ) }
				disabled={ ! hasUndo }
				onClick={ undo } />
			<IconButton
				icon="redo"
				label={ wp.i18n.__( 'Redo' ) }
				disabled={ ! hasRedo }
				onClick={ redo } />
			<Inserter position="bottom" />
			<div className="editor-tools__tabs">
				<Button>
					<Dashicon icon="visibility" />
					{ wp.i18n._x( 'Preview', 'imperative verb' ) }
				</Button>
				<Button onClick={ toggleSidebar } isToggled={ isSidebarOpened }>
					<Dashicon icon="admin-generic" />
					{ wp.i18n.__( 'Post Settings' ) }
				</Button>
			</div>
			<Button isPrimary isLarge>
				{ wp.i18n.__( 'Publish' ) }
			</Button>
		</div>
	);
}

export default connect(
	( state ) => ( {
		hasUndo: state.blocks.history.past.length > 0,
		hasRedo: state.blocks.history.future.length > 0,
		isSidebarOpened: state.isSidebarOpened,
	} ),
	( dispatch ) => ( {
		undo: () => dispatch( { type: 'UNDO' } ),
		redo: () => dispatch( { type: 'REDO' } ),
		toggleSidebar: () => dispatch( { type: 'TOGGLE_SIDEBAR' } )
	} )
)( Tools );
