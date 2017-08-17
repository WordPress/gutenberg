/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { first, last, reduce, get, find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, findDOMNode } from '@wordpress/element';
import { KeyboardShortcuts, DropZone } from '@wordpress/components';
import { getBlockTypes } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import VisualEditorBlockList from './block-list';
import PostTitle from '../../post-title';
import { getBlockUids, getMultiSelectedBlockUids } from '../../selectors';
import { clearSelectedBlock, multiSelect, redo, undo, removeBlocks, insertBlocks } from '../../actions';

class VisualEditor extends Component {
	constructor() {
		super( ...arguments );
		this.bindContainer = this.bindContainer.bind( this );
		this.bindBlocksContainer = this.bindBlocksContainer.bind( this );
		this.onClick = this.onClick.bind( this );
		this.selectAll = this.selectAll.bind( this );
		this.undoOrRedo = this.undoOrRedo.bind( this );
		this.deleteSelectedBlocks = this.deleteSelectedBlocks.bind( this );
		this.dropFiles = this.dropFiles.bind( this );
	}

	componentDidMount() {
		document.addEventListener( 'keydown', this.onKeyDown );
	}

	componentWillUnmount() {
		document.removeEventListener( 'keydown', this.onKeyDown );
	}

	bindContainer( ref ) {
		this.container = ref;
	}

	bindBlocksContainer( ref ) {
		this.blocksContainer = findDOMNode( ref );
	}

	onClick( event ) {
		if ( event.target === this.container || event.target === this.blocksContainer ) {
			this.props.clearSelectedBlock();
		}
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

	dropFiles( files ) {
		const transformation = reduce( getBlockTypes(), ( ret, blockType ) => {
			if ( ret ) {
				return ret;
			}

			return find( get( blockType, 'transforms.from', [] ), ( transform ) => (
				transform.type === 'files' && transform.isMatch( files )
			) );
		}, false );

		if ( transformation ) {
			transformation.transform( files ).then( ( blocks ) => {
				this.props.insertBlocks( blocks );
			} );
		}
	}

	render() {
		// Disable reason: Clicking the canvas should clear the selection
		/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return (
			<div
				role="region"
				aria-label={ __( 'Visual Editor' ) }
				className="editor-visual-editor"
				onMouseDown={ this.onClick }
				onTouchStart={ this.onClick }
				onKeyDown={ this.onKeyDown }
				ref={ this.bindContainer }
			>
				<DropZone
					onFilesDrop={ this.dropFiles }
				/>
				<KeyboardShortcuts shortcuts={ {
					'mod+a': this.selectAll,
					'mod+z': this.undoOrRedo,
					'mod+shift+z': this.undoOrRedo,
					backspace: this.deleteSelectedBlocks,
					del: this.deleteSelectedBlocks,
				} } />
				<PostTitle />
				<VisualEditorBlockList ref={ this.bindBlocksContainer } />
			</div>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
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
		insertBlocks,
	}
)( VisualEditor );
