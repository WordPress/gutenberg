/**
 * External dependencies
 */
import { first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, Fragment, compose } from '@wordpress/element';
import { KeyboardShortcuts } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { keycodes } from '@wordpress/utils';

const { rawShortcut } = keycodes;

class EditorGlobalKeyboardShortcuts extends Component {
	constructor() {
		super( ...arguments );

		this.selectAll = this.selectAll.bind( this );
		this.undoOrRedo = this.undoOrRedo.bind( this );
		this.save = this.save.bind( this );
		this.deleteSelectedBlocks = this.deleteSelectedBlocks.bind( this );
		this.clearMultiSelection = this.clearMultiSelection.bind( this );
	}

	selectAll( event ) {
		const { uids, onMultiSelect } = this.props;
		event.preventDefault();
		onMultiSelect( first( uids ), last( uids ) );
	}

	undoOrRedo( event ) {
		const { onRedo, onUndo } = this.props;

		if ( event.shiftKey ) {
			onRedo();
		} else {
			onUndo();
		}

		event.preventDefault();
	}

	save( event ) {
		event.preventDefault();
		this.props.onSave();
	}

	deleteSelectedBlocks( event ) {
		const { multiSelectedBlockUids, onRemove, isLocked } = this.props;
		if ( multiSelectedBlockUids.length ) {
			event.preventDefault();
			if ( ! isLocked ) {
				onRemove( multiSelectedBlockUids );
			}
		}
	}

	/**
	 * Clears current multi-selection, if one exists.
	 */
	clearMultiSelection() {
		const { hasMultiSelection, clearSelectedBlock } = this.props;
		if ( hasMultiSelection ) {
			clearSelectedBlock();
		}
	}

	render() {
		return (
			<Fragment>
				<KeyboardShortcuts
					shortcuts={ {
						[ rawShortcut.primary( 'a' ) ]: this.selectAll,
						[ rawShortcut.primary( 'z' ) ]: this.undoOrRedo,
						[ rawShortcut.primaryShift( 'z' ) ]: this.undoOrRedo,
						backspace: this.deleteSelectedBlocks,
						del: this.deleteSelectedBlocks,
						escape: this.clearMultiSelection,
					} }
				/>
				<KeyboardShortcuts
					bindGlobal
					shortcuts={ {
						[ rawShortcut.primary( 's' ) ]: this.save,
					} }
				/>
			</Fragment>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			getBlockOrder,
			getMultiSelectedBlockUids,
			hasMultiSelection,
			getEditorSettings,
		} = select( 'core/editor' );
		const { templateLock } = getEditorSettings();

		return {
			uids: getBlockOrder(),
			multiSelectedBlockUids: getMultiSelectedBlockUids(),
			hasMultiSelection: hasMultiSelection(),
			isLocked: !! templateLock,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			clearSelectedBlock,
			multiSelect,
			redo,
			undo,
			removeBlocks,
			savePost,
		} = dispatch( 'core/editor' );

		return {
			clearSelectedBlock,
			onMultiSelect: multiSelect,
			onRedo: redo,
			onUndo: undo,
			onRemove: removeBlocks,
			onSave: savePost,
		};
	} ),
] )( EditorGlobalKeyboardShortcuts );
