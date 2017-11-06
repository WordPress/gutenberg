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
 * Internal dependencies
 */
import './style.scss';
import Inserter from '../../inserter';
import BlockSwitcher from '../../block-switcher';
import BlockToolbar from '../../block-toolbar';
import NavigableToolbar from '../../navigable-toolbar';
import { getSelectedBlockCount, hasEditorUndo, hasEditorRedo, isFeatureActive } from '../../selectors';

function HeaderToolbar( { hasUndo, hasRedo, hasFixedToolbar, undo, redo, isMultiBlockSelection } ) {
	return (
		<NavigableToolbar
			className="editor-header-toolbar"
			aria-label={ __( 'Editor Toolbar' ) }
		>
			<Inserter position="bottom right" />
			<IconButton
				icon="undo"
				label={ __( 'Undo' ) }
				disabled={ ! hasUndo }
				onClick={ undo } />
			<IconButton
				icon="redo"
				label={ __( 'Redo' ) }
				disabled={ ! hasRedo }
				onClick={ redo } />
			{ isMultiBlockSelection && <BlockSwitcher key="switcher" /> }
			{ hasFixedToolbar && (
				<div className="editor-header-toolbar__block-toolbar">
					<BlockToolbar />
				</div>
			) }
		</NavigableToolbar>
	);
}

export default connect(
	( state ) => ( {
		hasUndo: hasEditorUndo( state ),
		hasRedo: hasEditorRedo( state ),
		hasFixedToolbar: isFeatureActive( state, 'fixedToolbar' ),
		isMultiBlockSelection: getSelectedBlockCount( state ) > 1,
	} ),
	( dispatch ) => ( {
		undo: () => dispatch( { type: 'UNDO' } ),
		redo: () => dispatch( { type: 'REDO' } ),
	} )
)( HeaderToolbar );
