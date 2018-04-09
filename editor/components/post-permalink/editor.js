/**
 * WordPress dependencies
 */
import { withDispatch, withSelect } from '@wordpress/data';
import { Component, compose } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';

class PostPermalinkEditor extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			editedPostName: '',
		};

		this.onSavePermalink = this.onSavePermalink.bind( this );
	}

	/**
	 * Returns the permalink parts to populate the form.
	 *
	 * @return {Object} The prefix, suffix, and postName for the form.
	 */
	getPermalinkParts() {
		const [ template, postName ] = this.props.samplePermalinkData;
		const { editedPostName } = this.state;
		const [ samplePermalinkPrefix, samplePermalinkSuffix ] = template.split( /%(?:postname|pagename)%/ );

		return {
			samplePermalinkPrefix,
			samplePermalinkSuffix,
			editedPostName: editedPostName || postName,
		};
	}

	onSavePermalink( event ) {
		const postName = this.state.editedPostName.replace( /\s+/g, '-' );
		const [ template, oldPostName ] = this.props.samplePermalinkData;

		event.preventDefault();

		this.props.onSave();

		if ( ! postName || postName === oldPostName ) {
			return;
		}

		this.props.editPost( {
			slug: postName,
			sample_permalink: [ template, postName ],
		} );

		this.setState( {
			editedPostName: postName,
		} );
	}

	render() {
		const {
			samplePermalinkPrefix,
			samplePermalinkSuffix,
			editedPostName,
		} = this.getPermalinkParts();

		/* eslint-disable jsx-a11y/no-autofocus */
		// Autofocus is allowed here, as this mini-UI is only loaded when the user clicks to open it.
		return (
			<form
				className="editor-post-permalink-editor"
				onSubmit={ this.onSavePermalink }>
				<span className="editor-post-permalink-editor__prefix">
					{ samplePermalinkPrefix }
				</span>
				<input
					className="editor-post-permalink-editor__edit"
					aria-label={ __( 'Edit post permalink' ) }
					value={ editedPostName }
					onChange={ ( event ) => this.setState( { editedPostName: event.target.value } ) }
					required
					autoFocus
				/>
				<span className="editor-post-permalink-editor__suffix">
					{ samplePermalinkSuffix }
				</span>
				<Button
					className="editor-post-permalink-editor__save"
					isLarge
					onClick={ this.onSavePermalink }
				>
					{ __( 'OK' ) }
				</Button>
			</form>
		);
		/* eslint-enable jsx-a11y/no-autofocus */
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { getEditedPostAttribute } = select( 'core/editor' );
		return {
			samplePermalinkData: getEditedPostAttribute( 'sample_permalink' ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { editPost } = dispatch( 'core/editor' );
		return { editPost };
	} ),
] )( PostPermalinkEditor );

