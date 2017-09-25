/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import Inserter from '../../inserter';
import { insertBlock } from '../../actions';

export class VisualEditorInserter extends Component {
	constructor() {
		super( ...arguments );

		this.showControls = this.toggleControls.bind( this, true );
		this.hideControls = this.toggleControls.bind( this, false );
		this.insertParagraph = this.insertBlock.bind( this, 'core/paragraph' );
		this.insertImage = this.insertBlock.bind( this, 'core/image' );

		this.state = {
			isShowingControls: false,
		};
	}

	toggleControls( isShowingControls ) {
		this.setState( { isShowingControls } );
	}

	insertBlock( name ) {
		const { onInsertBlock } = this.props;
		onInsertBlock( createBlock( name ) );
	}

	render() {
		const { isShowingControls } = this.state;
		const classes = classnames( 'editor-visual-editor__inserter', {
			'is-showing-controls': isShowingControls,
		} );

		return (
			<div
				className={ classes }
				onFocus={ this.showControls }
				onBlur={ this.hideControls }
			>
				<Inserter position="top right" />
				<IconButton
					icon="editor-paragraph"
					className="editor-inserter__block"
					onClick={ this.insertParagraph }
					label={ __( 'Insert paragraph block' ) }
				>
					{ __( 'Paragraph' ) }
				</IconButton>
				<IconButton
					icon="format-image"
					className="editor-inserter__block"
					onClick={ this.insertImage }
					label={ __( 'Insert image block' ) }
				>
					{ __( 'Image' ) }
				</IconButton>
			</div>
		);
	}
}

export default connect(
	null,
	{ onInsertBlock: insertBlock },
)( VisualEditorInserter );
