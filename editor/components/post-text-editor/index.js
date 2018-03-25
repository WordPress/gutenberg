/**
 * External dependencies
 */
import Textarea from 'react-autosize-textarea';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import { getEditedPostContent } from '../../store/selectors';
import { editPost, resetBlocks, checkTemplateValidity } from '../../store/actions';

class PostTextEditor extends Component {
	constructor() {
		super( ...arguments );

		this.startEditing = this.startEditing.bind( this );
		this.edit = this.edit.bind( this );
		this.stopEditing = this.stopEditing.bind( this );

		this.state = {
			value: null,
			isDirty: false,
		};
	}

	startEditing() {
		// Copying the post content into local state ensures that edits won't be
		// clobbered by changes to global editor state
		this.setState( { value: this.props.value } );
	}

	edit( event ) {
		const value = event.target.value;
		this.props.onChange( value );
		this.setState( { value, isDirty: true } );
	}

	stopEditing() {
		if ( this.state.isDirty ) {
			this.props.onPersist( this.state.value );
		}

		this.setState( { value: null, isDirty: false } );
	}

	render() {
		return (
			<Textarea
				autoComplete="off"
				value={ this.state.value || this.props.value }
				onFocus={ this.startEditing }
				onChange={ this.edit }
				onBlur={ this.stopEditing }
				className="editor-post-text-editor"
			/>
		);
	}
}

export default connect(
	( state ) => ( {
		value: getEditedPostContent( state ),
	} ),
	{
		onChange( content ) {
			return editPost( { content } );
		},
		onPersist( content ) {
			return [
				resetBlocks( parse( content ) ),
				checkTemplateValidity(),
			];
		},
	}
)( PostTextEditor );
