/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';

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

		this.clearSelectedOnFocusOut = this.clearSelectedOnFocusOut.bind( this );
	}

	componentDidMount() {
		// If a click occurs outside editor layout while in visual mode, treat
		// as intent to clear selected block. This preserves selection when
		// focus moves from block to post settings, but clears when moving from
		// block to the admin bar, sidebar, or below page content.
		this.content = document.getElementById( 'wpbody-content' );
		this.content.addEventListener( 'focusout', this.clearSelectedOnFocusOut );
	}

	componentWillUnmount() {
		this.content.removeEventListener( 'focusout', this.clearSelectedOnFocusOut );
		delete this.content;
	}

	clearSelectedOnFocusOut( event ) {
		if ( this.content.contains( event.relatedTarget ) ) {
			return;
		}

		this.props.clearSelectedBlock();
	}

	render() {
		// Disable reason: Clicking the canvas should clear the selection
		/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return (
			<div
				role="region"
				aria-label={ __( 'Visual Editor' ) }
				className="editor-visual-editor"
				onClick={ this.props.clearSelectedBlock }
			>
				<PostTitle />
				<VisualEditorBlockList />
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
