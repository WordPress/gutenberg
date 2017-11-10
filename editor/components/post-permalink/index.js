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
import { isEditedPostNew, getEditedPostAttribute } from '../../store/selectors';

class PostPermalink extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			showCopyConfirmation: false,
			editingSlug: false,
		};
		this.onCopy = this.onCopy.bind( this );
<<<<<<< HEAD
		this.onFinishCopy = this.onFinishCopy.bind( this );
=======
		this.onEditPermalink = this.onEditPermalink.bind( this );
		this.onCancelEditPermalink = this.onCancelEditPermalink.bind( this );
		this.onSavePermalink = this.onSavePermalink.bind( this );
>>>>>>> Open the slug edit form when clicking on the slug
	}

	componentWillUnmount() {
		clearTimeout( this.dismissCopyConfirmation );
	}

	onCopy() {
		this.setState( {
			showCopyConfirmation: true,
		} );
	}

	onFinishCopy() {
		this.setState( {
			showCopyConfirmation: false,
		} );
	}

	onEditPermalink( event ) {
		event.preventDefault();
		this.setState( { editingSlug: true } );
	}

	onCancelEditPermalink( event ) {
		event.preventDefault();
		this.setState( { editingSlug: false } );
	}

	onSavePermalink( event ) {
		event.preventDefault();
		this.setState( { editingSlug: false } );
	}

	render() {
		const { isNew, link, samplePermalink } = this.props;
		const { showCopyConfirmation, editingSlug } = this.state;
		if ( isNew || ! link ) {
			return null;
		}

		let permalink = link,
			viewLink = link;
		if ( samplePermalink ) {
			permalink = samplePermalink[ 0 ].replace( '%postname%', samplePermalink[ 1 ] );
			viewLink += '&preview=true';
		}

		const prefix = permalink.replace( /[^/]+\/?$/, '' ),
			slug = permalink.replace( /.*\/([^/]+)\/?$/, '$1' );

		return (
			<div className="editor-post-permalink">
				<Dashicon icon="admin-links" />
				<span className="editor-post-permalink__label">{ __( 'Permalink:' ) }</span>
				<span className="editor-post-permalink__link">
					<span className="editor-post-permalink__prefix">
						{ prefix }
					</span>
					{ ! editingSlug &&
						<Button
							className="editor-post-permalink__slug"
							onClick={ this.onEditPermalink }
						>
							{ slug }
						</Button>
					}
					{ editingSlug &&
						<form className="editor-post-permalink__slug-form" onSubmit={ this.onSavePermalink }>
							<input
								type="text"
								className="editor-post-permalink__slug-input"
								onBlur={ this.onCancelEditPermalink }
								value={ slug }
								required
							/>
						</form>
					}
				</span>
				<ClipboardButton
					className="button"
					text={ viewLink }
					onCopy={ this.onCopy }
					onFinishCopy={ this.onFinishCopy }
				>
					{ showCopyConfirmation ? __( 'Copied!' ) : __( 'Copy' ) }
				</ClipboardButton>
			</div>
		);
	}
}

export default connect(
	( state ) => {
		return {
			isNew: isEditedPostNew( state ),
			link: getEditedPostAttribute( state, 'link' ),
			samplePermalink: getEditedPostAttribute( state, 'sample_permalink' ),
		};
	}
)( PostPermalink );

