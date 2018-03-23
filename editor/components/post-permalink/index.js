/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Dashicon, ClipboardButton, Button } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import { isEditedPostNew, getEditedPostAttribute, getEditedPostPreviewLink } from '../../store/selectors';
import { editPost } from '../../store/actions';
import { getWPAdminURL } from '../../utils/url';

class PostPermalink extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			iconClass: '',
			samplePermalink: '',
			samplePermalinkPrefix: '',
			samplePermalinkSuffix: '',
			postName: '',
			editedPostName: '',
			editingPermalink: false,
		};

		this.onSavePermalink = this.onSavePermalink.bind( this );
	}

	componentWillMount() {
		if ( this.props.samplePermalinkData ) {
			this.updateSamplePermalink( this.props.samplePermalinkData[ 0 ], this.props.samplePermalinkData[ 1 ] );
		}
	}

	componentWillReceiveProps( nextProps ) {
		if ( this.props.samplePermalinkData !== nextProps.samplePermalinkData ) {
			this.updateSamplePermalink( nextProps.samplePermalinkData[ 0 ], nextProps.samplePermalinkData[ 1 ] );
		}
	}

	/**
	 * Updates the samplePermalink data in the state.
	 *
	 * @param {string} template Permalink structure to replace the tags in.
	 * @param {string} postName The post slug to use in replacements.
	 */
	updateSamplePermalink( template, postName ) {
		const regex = /%(?:postname|pagename)%/;
		this.setState( {
			samplePermalink: template.replace( regex, postName ),
			samplePermalinkPrefix: template.split( regex )[ 0 ],
			samplePermalinkSuffix: template.split( regex )[ 1 ],
			postName: postName,
		} );
	}

	onSavePermalink() {
		const postName = this.state.editedPostName.replace( /\s+/g, '-' );

		this.props.editPost( {
			slug: postName,
			sample_permalink: [ this.props.samplePermalinkData[ 0 ], postName ],
		} );

		this.setState( {
			editingPermalink: false,
			editedPostName: postName,
		} );
	}

	render() {
		const { isNew, previewLink, permalinkStructure } = this.props;
		const {
			iconClass,
			samplePermalink,
			samplePermalinkPrefix,
			samplePermalinkSuffix,
			postName,
			editingPermalink,
		} = this.state;

		if ( isNew || ! previewLink ) {
			return null;
		}

		return (
			<div className="editor-post-permalink">
				<ClipboardButton
					className="editor-post-permalink__copy"
					text={ samplePermalink }
					title={ __( 'Copy the permalink to your clipboard.' ) }
					onCopy={ () => this.setState( { iconClass: 'copied' } ) }
				>
					<Dashicon icon="admin-links" className={ iconClass } />
				</ClipboardButton>

				<span className="editor-post-permalink__label">{ __( 'Permalink:' ) }</span>

				{ // Show the sample permalink when it isn't being editing.
					! editingPermalink &&
					<Button className="editor-post-permalink__link" href={ previewLink } target="_blank">
						{ decodeURI( samplePermalink ) }
					</Button>
				}

				{ // When we're editing the permalink, show the edit form.
					editingPermalink &&
					<form
						className="editor-post-permalink__edit-form"
						onSubmit={ this.onSavePermalink }>
						<span className="editor-post-permalink__prefix">
							{ samplePermalinkPrefix }
						</span>
						<input
							type="text"
							className="editor-post-permalink__edit"
							defaultValue={ postName }
							onChange={ ( e ) => this.setState( { editedPostName: e.target.value } ) }
							required
						/>
						<span className="editor-post-permalink__suffix">
							{ samplePermalinkSuffix }
						</span>
						<Button
							className="editor-post-permalink__save button"
							onClick={ this.onSavePermalink }
						>
							{ __( 'Ok' ) }
						</Button>
					</form>
				}

				{ // When the site has pretty permalinks, and we're not currently editing, show the Edit button.
					permalinkStructure && ! editingPermalink &&
					<Button
						className="editor-post-permalink__edit button"
						onClick={ () => this.setState( { editingPermalink: true } ) }
					>
						{ __( 'Edit' ) }
					</Button>
				}

				{ // When the site doesn't have pretty permalinks, show a button to enable them.
					! permalinkStructure &&
					<Button
						className="editor-post-permalink__change button"
						href={ getWPAdminURL( 'options-permalink.php' ) }
						target="_blank"
					>
						{ __( 'Change Permalinks' ) }
					</Button>
				}
			</div>
		);
	}
}

export default connect(
	( state ) => {
		return {
			isNew: isEditedPostNew( state ),
			previewLink: getEditedPostPreviewLink( state ),
			samplePermalinkData: getEditedPostAttribute( state, 'sample_permalink' ),

			permalinkStructure: window.wpApiSettings.schema.permalink_structure,
		};
	},
	{
		editPost,
	}
)( PostPermalink );

