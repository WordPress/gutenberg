/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, findDOMNode } from '@wordpress/element';
import { KeyboardShortcuts } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import VisualEditorBlockList from './block-list';
import PostTitle from '../../post-title';
import WritingFlow from '../../writing-flow';
import { getBlockUids, getMultiSelectedBlockUids } from '../../selectors';
import { clearSelectedBlock, multiSelect, redo, undo, removeBlocks } from '../../actions';

class VisualEditor extends Component {
	constructor() {
		super( ...arguments );
		this.bindContainer = this.bindContainer.bind( this );
		this.bindBlocksContainer = this.bindBlocksContainer.bind( this );
		this.onClick = this.onClick.bind( this );
		this.selectAll = this.selectAll.bind( this );
		this.undoOrRedo = this.undoOrRedo.bind( this );
		this.deleteSelectedBlocks = this.deleteSelectedBlocks.bind( this );
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
				<KeyboardShortcuts shortcuts={ {
					'mod+a': this.selectAll,
					'mod+z': this.undoOrRedo,
					'mod+shift+z': this.undoOrRedo,
					backspace: this.deleteSelectedBlocks,
					del: this.deleteSelectedBlocks,
				} } />
				<WritingFlow>
					<PostTitle />
					<VisualEditorBlockList ref={ this.bindBlocksContainer } />
				</WritingFlow>
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
	}
)( VisualEditor );
