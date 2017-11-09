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
import { getMultiSelectedBlockUids, hasEditorUndo, hasEditorRedo, isFeatureActive } from '../../selectors';

function HeaderToolbar( { hasUndo, hasRedo, hasFixedToolbar, undo, redo, isMultiBlockSelection, selectedBlockUids } ) {
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
			{ isMultiBlockSelection && (
				<div className="editor-header-toolbar__block-toolbar">
					<BlockSwitcher key="switcher" uids={ selectedBlockUids } />
				</div> ) }
			{ hasFixedToolbar && (
				<div className="editor-header-toolbar__block-toolbar">
					<BlockToolbar />
				</div>
			) }
		</NavigableToolbar>
	);
}

export default connect(
	( state ) => {
		const selectedBlockUids = getMultiSelectedBlockUids( state );
		return {
			hasUndo: hasEditorUndo( state ),
			hasRedo: hasEditorRedo( state ),
			hasFixedToolbar: isFeatureActive( state, 'fixedToolbar' ),
			isMultiBlockSelection: selectedBlockUids.length > 1,
			selectedBlockUids,
		};
	},
	( dispatch ) => ( {
		undo: () => dispatch( { type: 'UNDO' } ),
		redo: () => dispatch( { type: 'REDO' } ),
		onFocusBlockEdit( uid, config ) {
			dispatch( focusBlockEdit( uid, config ) );
		},
	} )
)( HeaderToolbar );
