/**
 * External dependencies
 */
import { first, last, some, flow } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
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
	group: {
		raw: rawShortcut.primaryAlt( 'g' ),
		display: displayShortcut.primaryAlt( 'g' ),
	},
	ungroup: {
		raw: rawShortcut.secondary( 'g' ),
		display: displayShortcut.secondary( 'g' ),
	},

};

class BlockEditorKeyboardShortcuts extends Component {
	constructor() {
		super( ...arguments );

		this.selectAll = this.selectAll.bind( this );
		this.deleteSelectedBlocks = this.deleteSelectedBlocks.bind( this );
		this.clearMultiSelection = this.clearMultiSelection.bind( this );
	}

	selectAll( event ) {
		const { rootBlocksClientIds, onMultiSelect } = this.props;
		event.preventDefault();
		onMultiSelect( first( rootBlocksClientIds ), last( rootBlocksClientIds ) );
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
			<>
				<KeyboardShortcuts
					shortcuts={ {
						[ rawShortcut.primary( 'a' ) ]: this.selectAll,
						backspace: this.deleteSelectedBlocks,
						del: this.deleteSelectedBlocks,
						escape: this.clearMultiSelection,
					} }
				/>
				{ selectedBlockClientIds.length > 0 && (
					<BlockActions clientIds={ selectedBlockClientIds }>
						{ ( { onDuplicate, onRemove, onInsertAfter, onInsertBefore, onGroup, onUnGroup } ) => (
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

									// Does not clash with any known browser/native shortcuts, but preventDefault
									// is used to prevent any obscure unknown shortcuts from triggering.
									[ shortcuts.group.raw ]: flow( preventDefault, onGroup ),

									// Does not clash with any known browser/native shortcuts, but preventDefault
									// is used to prevent any obscure unknown shortcuts from triggering.
									[ shortcuts.ungroup.raw ]: flow( preventDefault, onUnGroup ),
								} }
							/>
						) }
					</BlockActions>
				) }
			</>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			getBlockOrder,
			getSelectedBlockClientIds,
			hasMultiSelection,
			getBlockRootClientId,
			getTemplateLock,
		} = select( 'core/block-editor' );
		const selectedBlockClientIds = getSelectedBlockClientIds();

		return {
			rootBlocksClientIds: getBlockOrder(),
			hasMultiSelection: hasMultiSelection(),
			isLocked: some(
				selectedBlockClientIds,
				( clientId ) => !! getTemplateLock( getBlockRootClientId( clientId ) )
			),
			selectedBlockClientIds,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			clearSelectedBlock,
			multiSelect,
			removeBlocks,
		} = dispatch( 'core/block-editor' );

		return {
			clearSelectedBlock,
			onMultiSelect: multiSelect,
			onRemove: removeBlocks,
		};
	} ),
] )( BlockEditorKeyboardShortcuts );
