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
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal Dependencies
 */
import './style.scss';
import {
	isEditedPostNew,
	isCurrentPostPublished,
	getEditedPostAttribute,
} from '../../store/selectors';
import { editPost } from '../../store/actions';

/**
 * Constants
 */
const REGEXP_NEWLINES = /[\r\n]+/g;

class PostPermalink extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			editingSlug: false,
			permalink: '',
		};
		this.getSlug = this.getSlug.bind( this );
		this.onChangePermalink = this.onChangePermalink.bind( this );
		this.onEditPermalink = this.onEditPermalink.bind( this );
		this.onSavePermalink = this.onSavePermalink.bind( this );
		this.onCopy = this.onCopy.bind( this );
	}

	/**
	 * Returns a permalink for a given post slug.
	 *
	 * @param {string} slug The post slug to insert in into the permalink.
	 *
	 * @returns {string} The full permalink.
	 */
	getPermalink( slug ) {
		let permalink = this.props.link;
		const samplePermalink = this.props.samplePermalink;
		if ( samplePermalink ) {
			permalink = samplePermalink[ 0 ].replace( '%postname%', slug || samplePermalink[ 1 ] );
		}

		return permalink;
	}

	/**
	 * Returns the slug for the current post.
	 *
	 * @returns {string} The slug.
	 */
	getSlug() {
		const { actualSlug, isPublished, samplePermalink } = this.props;

		if ( isPublished ) {
			return actualSlug;
		}

		if ( samplePermalink ) {
			return samplePermalink[ 1 ];
		}

		return '';
	}

	componentDidMount() {
		this.setState( {
			permalink: this.getPermalink(),
			slug: this.getSlug(),
		} );
	}

	componentWillUnmount() {
		clearTimeout( this.dismissCopyConfirmation );
	}

	componentWillReceiveProps() {
		const slug = this.getSlug();
		this.setState( {
			permalink: this.getPermalink( slug ),
			slug: slug,
		} );
	}

	/**
	 * Event handler for the slug input field being changed.
	 *
	 * @param {Object} event Change event
	 */
	onChangePermalink( event ) {
		this.setState( { slug: event.target.value } );
	}

	/**
	 * Event handler for the Edit button being clicked.
	 */
	onEditPermalink() {
		this.setState( { editingSlug: true } );
	}

	/**
	 * Event handler for the slug being saved.
	 */
	onSavePermalink() {
		this.setState( {
			editingSlug: false,
			permalink: this.getPermalink( this.state.slug ),
		} );
		const newSlug = this.state.slug.replace( REGEXP_NEWLINES, ' ' );
		this.props.onUpdate( newSlug );
	}

	/**
	 * Event handler for the copy button to show feedback.
	 */
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
		const { isNew, link } = this.props;
		const { editingSlug, permalink, slug } = this.state;
		if ( isNew || ! link ) {
			return null;
		}
		const prefix = permalink.replace( /[^/]+\/?$/, '' );

		return (
			<div className="editor-post-permalink">
				<Dashicon icon="admin-links" />
				<span className="editor-post-permalink__label">{ __( 'Permalink:' ) }</span>
				{ ! editingSlug &&
					<Button
						className="editor-post-permalink__link"
						href={ addQueryArgs( this.props.link, { preview: true } ) }
						target="_blank"
					>
						{ permalink }
					</Button>
				}
				{ editingSlug &&
					<form className="editor-post-permalink__slug-form" onSubmit={ this.onSavePermalink }>
						<span className="editor-post-permalink__prefix">
							{ prefix }
						</span>
						<input
							type="text"
							className="editor-post-permalink__slug-input"
							defaultValue={ slug }
							onChange={ this.onChangePermalink }
							required
						/>
						/
						<Button
							className="editor-post-permalink__save"
							onClick={ this.onSavePermalink }
							isLarge
						>
							{ __( 'Ok' ) }
						</Button>
					</form>
				}
				{ ! editingSlug &&
					<ClipboardButton
						className="button"
						text={ link }
						onCopy={ this.onCopy }
					>
						{ this.state.showCopyConfirmation ? __( 'Copied!' ) : __( 'Copy' ) }
					</ClipboardButton>
				}
				{ ! editingSlug &&
					<Button
						className="editor-post-permalink__edit button"
						onClick={ this.onEditPermalink }
					>
						{ __( 'Edit' ) }
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
			isPublished: isCurrentPostPublished( state ),
			link: getEditedPostAttribute( state, 'link' ),
			samplePermalink: getEditedPostAttribute( state, 'sample_permalink' ),
			actualSlug: getEditedPostAttribute( state, 'slug' ),
		};
	},
	{
		onUpdate( slug ) {
			return editPost( { slug } );
		},
	}
)( PostPermalink );

