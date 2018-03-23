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

		this.handleFocus = this.handleFocus.bind( this );
		this.handleChange = this.handleChange.bind( this );
		this.handleBlur = this.handleBlur.bind( this );

		this.state = {
			value: null,
			isDirty: false,
		};
	}

	handleFocus() {
		this.setState( { value: this.props.value } );
	}

	handleChange( event ) {
		const value = event.target.value;
		this.props.onChange( value );
		this.setState( { value, isDirty: true } );
	}

	handleBlur() {
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
				onFocus={ this.handleFocus }
				onChange={ this.handleChange }
				onBlur={ this.handleBlur }
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
