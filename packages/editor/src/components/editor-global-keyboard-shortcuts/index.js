/**
 * External dependencies
 */
import { first, last, some, flow } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { KeyboardShortcuts } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { rawShortcut, displayShortcut } from '@wordpress/keycodes';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockActions from '../block-actions';

const preventDefault = ( event ) => {
	event.preventDefault();
	return event;
};

export const shortcuts = {
	duplicate: {
		raw: rawShortcut.primaryShift( 'd' ),
		display: displayShortcut.primaryShift( 'd' ),
	},
	removeBlock: {
		raw: rawShortcut.access( 'z' ),
		display: displayShortcut.access( 'z' ),
	},
	insertBefore: {
		raw: rawShortcut.primaryAlt( 't' ),
		display: displayShortcut.primaryAlt( 't' ),
	},
	insertAfter: {
		raw: rawShortcut.primaryAlt( 'y' ),
		display: displayShortcut.primaryAlt( 'y' ),
	},
};

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
		const { rootBlocksClientIds, onMultiSelect } = this.props;
		event.preventDefault();
		onMultiSelect( first( rootBlocksClientIds ), last( rootBlocksClientIds ) );
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
		const { selectedBlockClientIds, hasMultiSelection, onRemove, isLocked } = this.props;
		if ( hasMultiSelection ) {
			event.preventDefault();
			if ( ! isLocked ) {
				onRemove( selectedBlockClientIds );
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
			window.getSelection().removeAllRanges();
		}
	}

	render() {
		const { selectedBlockClientIds } = this.props;
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
				{ selectedBlockClientIds.length > 0 && (
					<BlockActions clientIds={ selectedBlockClientIds }>
						{ ( { onDuplicate, onRemove, onInsertAfter, onInsertBefore } ) => (
							<KeyboardShortcuts
								bindGlobal
								shortcuts={ {
									// Prevents bookmark all Tabs shortcut in Chrome when devtools are closed.
									// Prevents reposition Chrome devtools pane shortcut when devtools are open.
									[ shortcuts.duplicate.raw ]: flow( preventDefault, onDuplicate ),

									// Does not clash with any known browser/native shortcuts, but preventDefault
									// is used to prevent any obscure unknown shortcuts from triggering.
									[ shortcuts.removeBlock.raw ]: flow( preventDefault, onRemove ),

									// Prevent 'view recently closed tabs' in Opera using preventDefault.
									[ shortcuts.insertBefore.raw ]: flow( preventDefault, onInsertBefore ),

									// Does not clash with any known browser/native shortcuts, but preventDefault
									// is used to prevent any obscure unknown shortcuts from triggering.
									[ shortcuts.insertAfter.raw ]: flow( preventDefault, onInsertAfter ),
								} }
							/>
						) }
					</BlockActions>
				) }
			</Fragment>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			getBlockOrder,
			getMultiSelectedBlockClientIds,
			hasMultiSelection,
			isEditedPostDirty,
			getBlockRootClientId,
			getTemplateLock,
			getSelectedBlockClientId,
		} = select( 'core/editor' );
		const selectedBlockClientId = getSelectedBlockClientId();
		const selectedBlockClientIds = selectedBlockClientId ? [ selectedBlockClientId ] : getMultiSelectedBlockClientIds();

		return {
			rootBlocksClientIds: getBlockOrder(),
			hasMultiSelection: hasMultiSelection(),
			isLocked: some(
				selectedBlockClientIds,
				( clientId ) => !! getTemplateLock( getBlockRootClientId( clientId ) )
			),
			isDirty: isEditedPostDirty(),
			selectedBlockClientIds,
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const {
			clearSelectedBlock,
			multiSelect,
			redo,
			undo,
			removeBlocks,
			savePost,
		} = dispatch( 'core/editor' );

		return {
			onSave() {
				// TODO: This should be handled in the `savePost` effect in
				// considering `isSaveable`. See note on `isEditedPostSaveable`
				// selector about dirtiness and meta-boxes. When removing, also
				// remember to remove `isDirty` prop passing from `withSelect`.
				//
				// See: `isEditedPostSaveable`
				if ( ! ownProps.isDirty ) {
					return;
				}

				savePost();
			},
			clearSelectedBlock,
			onMultiSelect: multiSelect,
			onRedo: redo,
			onUndo: undo,
			onRemove: removeBlocks,
		};
	} ),
] )( EditorGlobalKeyboardShortcuts );
