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
						{ ( { onDuplicate, onRemove, onInsertAfter, onInsertBefore, templateLock } ) => {
							const list = {};

							if ( ! templateLock.has( 'insert' ) ) {
								// Prevents bookmark all Tabs shortcut in Chrome when devtools are closed.
								// Prevents reposition Chrome devtools pane shortcut when devtools are open.
								list[ shortcuts.duplicate.raw ] = flow( preventDefault, onDuplicate );

								// Prevent 'view recently closed tabs' in Opera using preventDefault.
								list[ shortcuts.insertBefore.raw ] = flow( preventDefault, onInsertBefore );

								// Does not clash with any known browser/native shortcuts, but preventDefault
								// is used to prevent any obscure unknown shortcuts from triggering.
								list[ shortcuts.insertAfter.raw ] = flow( preventDefault, onInsertAfter );
							}

							if ( ! templateLock.has( 'remove' ) ) {
								// Does not clash with any known browser/native shortcuts, but preventDefault
								// is used to prevent any obscure unknown shortcuts from triggering.
								list[ shortcuts.removeBlock.raw ] = flow( preventDefault, onRemove );
							}

							return (
								<KeyboardShortcuts
									bindGlobal
									shortcuts={ list }
								/>
							);
						} }
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
				( clientId ) => getTemplateLock( getBlockRootClientId( clientId ) ).has( 'remove' )
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
