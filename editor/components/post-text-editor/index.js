/**
 * External dependencies
 */
import Textarea from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/utils';
import { Component, compose, Fragment } from '@wordpress/element';
import { parse } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';
import { withInstanceId } from '@wordpress/components';

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

	componentDidUpdate( prevProps ) {
		// If we receive a new value while we're editing (but before we've made
		// changes), go ahead and clobber the local state
		if ( this.props.value !== prevProps.value && this.state.value && ! this.state.isDirty ) {
			this.setState( { value: this.props.value } );
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
		const { value, placeholder, instanceId } = this.props;
		const decodedPlaceholder = decodeEntities( placeholder );

		return (
			<Fragment>
				<label htmlFor={ `post-content-${ instanceId }` } className="screen-reader-text">
					{ decodedPlaceholder || __( 'Write your story' ) }
				</label>
				<Textarea
					autoComplete="off"
					value={ this.state.value || value }
					onFocus={ this.startEditing }
					onChange={ this.edit }
					onBlur={ this.stopEditing }
					className="editor-post-text-editor"
					id={ `post-content-${ instanceId }` }
					placeholder={ decodedPlaceholder || __( 'Write your story' ) }
				/>
			</Fragment>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { getEditedPostContent, getEditorSettings } = select( 'core/editor' );
		const { bodyPlaceholder } = getEditorSettings();
		return {
			value: getEditedPostContent(),
			placeholder: bodyPlaceholder,
		};
	} ),
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
	withInstanceId,
] )( PostTextEditor );
