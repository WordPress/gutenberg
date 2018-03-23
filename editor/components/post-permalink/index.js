/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Dashicon, Button } from '@wordpress/components';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal Dependencies
 */
import './style.scss';
import { isEditedPostNew, getEditedPostAttribute } from '../../store/selectors';
import { getWPAdminURL } from '../../utils/url';

class PostPermalink extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
		};
	}

	componentWillMount() {
		if ( this.props.samplePermalinkData ) {
			this.setState( {
				samplePermalink: this.generatePermalink( this.props.samplePermalinkData[0], this.props.samplePermalinkData[1] ),
			} );
		}
	}

	componentWillReceiveProps( nextProps ) {
		console.log( nextProps );
		if ( this.props.samplePermalinkData !== nextProps.samplePermalinkData ) {
			this.setState( {
				samplePermalink: this.generatePermalink( nextProps.samplePermalinkData[0], nextProps.samplePermalinkData[1] ),
			} );
		}
	}

	/**
	 * Replace the %postname% and %pagename% tags in a sample permalink URL with actual values.
	 *
	 * @param {string} template  Permalink structure to replace the tags in.
	 * @param {string} post_name The post slug to use in replacements.
	 *
	 * @return {string} Prepared permalink.
	 */
	generatePermalink( template, post_name ) {
		return template.replace( /%(postname|pagename)%/, post_name );
	}

		this.setState( {
		} );
	}

	render() {
		const { isNew, link, permalinkStructure } = this.props;
		const { samplePermalink } = this.state;

		if ( isNew || ! link ) {
			return null;
		}

		var hrefLink = link;
		var displayLink = decodeURI( link );
		if ( samplePermalink ) {
			hrefLink = addQueryArgs( hrefLink, { preview: true } );
			displayLink = samplePermalink;
		}

		return (
			<div className="editor-post-permalink">
				<Dashicon icon="admin-links" />
				<span className="editor-post-permalink__label">{ __( 'Permalink:' ) }</span>
				<Button className="editor-post-permalink__link" href={ hrefLink } target="_blank">
					{ samplePermalink }
				</Button>

				{ ! permalinkStructure &&
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
			link: getEditedPostAttribute( state, 'link' ),
			samplePermalinkData: getEditedPostAttribute( state, 'sample_permalink' ),

			permalinkStructure: window.wpApiSettings.schema.permalink_structure,
		};
	}
)( PostPermalink );

