/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component, findDOMNode } from 'element';

/**
 * Internal dependencies
 */
import './style.scss';
import Inserter from '../../inserter';
import VisualEditorBlockList from './block-list';
import PostTitle from '../../post-title';
import { clearSelectedBlock } from '../../actions';

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
		this.blocksContainer = findDOMNode( ref );
	}

	onClick( event ) {
		if ( event.target === this.container || event.target === this.blocksContainer ) {
			this.props.clearSelectedBlock();
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
				onClick={ this.onClick }
				ref={ this.bindContainer }
			>
				<PostTitle />
				<VisualEditorBlockList ref={ this.bindBlocksContainer } />
				<Inserter position="top right" />
			</div>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	}
}

export default connect(
	undefined,
	{ clearSelectedBlock }
)( VisualEditor );
