/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';
import { ExternalLink, PanelBody, ClipboardButton } from 'components';
import { InspectorControls } from 'blocks';

/**
 * Internal Dependencies
 */
import { getEditedPostAttribute } from '../../selectors';
import { editPost } from '../../actions';

const { TextControl } = InspectorControls;

class PostPermalink extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			showCopyConfirmation: false,
		};
		this.onCopy = this.onCopy.bind( this );
	}

	componentWillUnmout() {
		clearTimeout( this.dismissCopyConfirmation );
	}

	onCopy() {
		this.setState( {
			showCopyConfirmation: true,
		} );

		clearTimeout( this.dismissCopyConfirmation );
		this.dismissCopyConfirmation = setTimeout( () => {
			this.setState( {
				showCopyConfirmation: false,
			} );
		}, 4000 );
	}

	render() {
		const { slug, link, onUpdateSlug } = this.props;

		return (
			<PanelBody title={ __( 'Permalink' ) } initialOpen={ false }>
				<p>
					<ExternalLink href={ link }>{ link }</ExternalLink>
					<ClipboardButton className="button button-small" text={ link } onCopy={ this.onCopy }>
						{ this.state.showCopyConfirmation ? __( 'Copied!' ) : __( 'Copy' ) }
					</ClipboardButton>
				</p>
				<TextControl
					label={ __( 'Slug' ) }
					value={ slug }
					onChange={ ( value ) => onUpdateSlug( value ) }
				/>
			</PanelBody>
		);
	}
}

export default connect(
	( state ) => {
		return {
			// isNew: isEditedPostNew( state ),
			slug: getEditedPostAttribute( state, 'slug' ),
			link: getEditedPostAttribute( state, 'link' ),
		};
	},
	( dispatch ) => {
		return {
			onUpdateSlug( slug ) {
				dispatch( editPost( { slug } ) );
			},
		};
	}
)( PostPermalink );

