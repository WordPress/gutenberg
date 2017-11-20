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
import { Inserter, BlockToolbar } from '../../components';
import BlockSwitcher from '../../components/block-switcher';
import NavigableToolbar from '../../navigable-toolbar';
import TableOfContents from '../../table-of-contents';
import { getMultiSelectedBlockUids, hasEditorUndo, hasEditorRedo, isFeatureActive } from '../../state/selectors';

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
			<TableOfContents />
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
	} )
)( HeaderToolbar );
