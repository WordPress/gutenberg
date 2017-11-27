/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { KeyboardShortcuts } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getBlockUids, getMultiSelectedBlockUids } from '../../selectors';
import { clearSelectedBlock, multiSelect, redo, undo, removeBlocks } from '../../actions';

class EditorGlobalKeyboardShortcuts extends Component {
	constructor() {
		super( ...arguments );
		this.selectAll = this.selectAll.bind( this );
		this.undoOrRedo = this.undoOrRedo.bind( this );
		this.deleteSelectedBlocks = this.deleteSelectedBlocks.bind( this );
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

	deleteSelectedBlocks( event ) {
		const { multiSelectedBlockUids, onRemove } = this.props;
		if ( multiSelectedBlockUids.length ) {
			event.preventDefault();
			onRemove( multiSelectedBlockUids );
		}
	}

	render() {
		return (
			<KeyboardShortcuts shortcuts={ {
				'mod+a': this.selectAll,
				'mod+z': this.undoOrRedo,
				'mod+shift+z': this.undoOrRedo,
				backspace: this.deleteSelectedBlocks,
				del: this.deleteSelectedBlocks,
				escape: this.props.clearSelectedBlock,
			} } />
		);
	}
}

export default connect(
	( state ) => {
		return {
			uids: getBlockUids( state ),
			multiSelectedBlockUids: getMultiSelectedBlockUids( state ),
		};
	},
	{
		clearSelectedBlock,
		onMultiSelect: multiSelect,
		onRedo: redo,
		onUndo: undo,
		onRemove: removeBlocks,
	},
	undefined,
	{ storeKey: 'editorStore' }
)( EditorGlobalKeyboardShortcuts );
