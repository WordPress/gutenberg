/**
 * External dependencies
 */
import Textarea from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { Component, compose } from '@wordpress/element';
import { parse } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';

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

	componentWillReceiveProps( nextProps ) {
		// If we receive a new value while we're editing (but before we've made
		// changes), go ahead and clobber the local state
		if ( this.props.value !== nextProps.value && this.state.value && ! this.state.isDirty ) {
			this.setState( { value: nextProps.value } );
		}
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

export default compose( [
	withSelect( ( select ) => ( {
		value: select( 'core/editor' ).getEditedPostContent(),
	} ) ),
	withDispatch( ( dispatch ) => {
		const { editPost, resetBlocks, checkTemplateValidity } = dispatch( 'core/editor' );
		return {
			onChange( content ) {
				editPost( { content } );
			},
			onPersist( content ) {
				resetBlocks( parse( content ) );
				checkTemplateValidity();
			},
		};
	} ),
] )( PostTextEditor );
