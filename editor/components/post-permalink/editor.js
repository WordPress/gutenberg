/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import { getEditedPostAttribute } from '../../store/selectors';
import { editPost } from '../../store/actions';

class PostPermalinkEditor extends Component {
	constructor() {
		super( ...arguments );

		this.onSavePermalink = this.onSavePermalink.bind( this );
	}

	/**
	 * Returns the permalink parts to populate the form.
	 *
	 * @return {Object} The prefix, suffix, and postName for the form.
	 */
	getPermalinkParts() {
		const [ template, postName ] = this.props.samplePermalinkData;
		const [ samplePermalinkPrefix, samplePermalinkSuffix ] = template.split( /%(?:postname|pagename)%/ );

		return {
			samplePermalinkPrefix,
			samplePermalinkSuffix,
			postName,
		};
	}

	onSavePermalink() {
		const postName = this.state.editedPostName.replace( /\s+/g, '-' );
		const [ template, oldPostName ] = this.props.samplePermalinkData;

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

		this.props.onSave();
	}

	render() {
		const {
			samplePermalinkPrefix,
			samplePermalinkSuffix,
			postName,
		} = this.getPermalinkParts();

		return (
			<div className="editor-post-permalink-editor">
				<form
					className="editor-post-permalink__edit-form"
					onSubmit={ this.onSavePermalink }>
					<span className="editor-post-permalink__prefix">
						{ samplePermalinkPrefix }
					</span>
					<input
						className="editor-post-permalink__edit"
						aria-label={ __( 'Edit post permalink' ) }
						defaultValue={ postName }
						onChange={ ( event ) => this.setState( { editedPostName: event.target.value } ) }
						required
					/>
					<span className="editor-post-permalink__suffix">
						{ samplePermalinkSuffix }
					</span>
					<Button
						className="editor-post-permalink__save button"
						onClick={ this.onSavePermalink }
					>
						{ __( 'OK' ) }
					</Button>
				</form>
			</div>
		);
	}
}

export default connect(
	( state ) => {
		return {
			samplePermalinkData: getEditedPostAttribute( state, 'sample_permalink' ),

			permalinkStructure: window.wpApiSettings.schema.permalink_structure,
		};
	},
	{
		editPost,
	}
)( PostPermalinkEditor );

