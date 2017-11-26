/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component, findDOMNode } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { BlockList, PostTitle, WritingFlow, DefaultBlockAppender, EditorGlobalKeyboardShortcuts } from '../../../components';
import { isFeatureActive } from '../../../selectors';
import { clearSelectedBlock } from '../../../actions';

class VisualEditor extends Component {
	constructor() {
		super( ...arguments );
		this.bindContainer = this.bindContainer.bind( this );
		this.bindBlocksContainer = this.bindBlocksContainer.bind( this );
		this.onClick = this.onClick.bind( this );
	}

	bindContainer( ref ) {
		this.container = ref;
	}

	bindBlocksContainer( ref ) {
		// Disable reason: Need DOM node to determine if clicking on layout
		// canvas when intending to clear block selection.
		// TODO: Refactor block selection clearing using blur events on block.
		// eslint-disable-next-line react/no-find-dom-node
		this.blocksContainer = findDOMNode( ref );
	}

	onClick( event ) {
		if ( event.target === this.container || event.target === this.blocksContainer ) {
			this.props.clearSelectedBlock();
		}
	}

	render() {
		// Disable reason: Clicking the canvas should clear the selection
		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<div
				className="editor-visual-editor"
				onMouseDown={ this.onClick }
				onTouchStart={ this.onClick }
				ref={ this.bindContainer }
			>
				<EditorGlobalKeyboardShortcuts />
				<WritingFlow>
					<PostTitle />
					<BlockList
						ref={ this.bindBlocksContainer }
						showContextualToolbar={ ! this.props.hasFixedToolbar }
					/>
				</WritingFlow>
				<DefaultBlockAppender />
			</div>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions */
	}
}

export default connect(
	( state ) => {
		return {
			hasFixedToolbar: isFeatureActive( state, 'fixedToolbar' ),
		};
	},
	{
		clearSelectedBlock,
	}
)( VisualEditor );
