/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, ClipboardButton } from '@wordpress/components';
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
		this.bindCopyButton = this.bindNode.bind( this, 'copyButton' );
		this.setFocus = this.setFocus.bind( this );
		this.getSlug = this.getSlug.bind( this );
		this.onChangePermalink = this.onChangePermalink.bind( this );
		this.onEditPermalink = this.onEditPermalink.bind( this );
		this.onSavePermalink = this.onSavePermalink.bind( this );
		this.onCopy = this.onCopy.bind( this );

		this.nodes = {};
	}

	/**
	 * Set the focus on the copy button.
	 *
	 * This seems to be the most useful default for keyboard navigation.
	 */
	setFocus() {
		this.focusCopyButton();
	}

	/**
	 * Focus the test input that constains the editable permalink slug.
	 */
	focusPermalinkInput() {
		document.querySelector( '.editor-post-permalink__slug-input' ).focus();
	}

	/**
	 * Focus the copy button that copies the permalink to the clipboard.
	 */
	focusCopyButton() {
		document.querySelector( '.editor-post-permalink__copy' ).focus();
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

	/**
	 * Bind a node to the nodes container.
	 *
	 * @param {string} name Name of the node to bind.
	 * @param {Object} node Reference to the node.
	 */
	bindNode( name, node ) {
		this.nodes[ name ] = node;
	}

	/**
	 * Set permalink and slug to their initial state after mounting the component.
	 */
	componentDidMount() {
		this.setState( {
			permalink: this.getPermalink(),
			slug: this.getSlug(),
		} );
	}

	/**
	 * Clear the confirmation display timeout after unmounting.
	 */
	componentWillUnmount() {
		clearTimeout( this.dismissCopyConfirmation );
	}

	/**
	 * Adapt slug and permalink when the props change.
	 */
	componentWillReceiveProps() {
		const slug = this.getSlug();
		this.setState( {
			permalink: this.getPermalink( slug ),
			slug: slug,
		} );
	}

	/**
	 * Adapt the state if the permalink was modified.
	 *
	 * @param {Object} event Change event.
	 */
	onChangePermalink( event ) {
		this.setState( { slug: event.target.value } );
	}

	/**
	 * Initialize editing and focus the permalink input field when the "Edit"
	 * button is clicked.
	 */
	onEditPermalink() {
		this.setState(
			{ editingSlug: true },
			this.focusPermalinkInput
		);
	}

	/**
	 * Adapt state & props and focus the copy button when the permalink is saved.
	 */
	onSavePermalink() {
		this.setState(
			{
				editingSlug: false,
				permalink: this.getPermalink( this.state.slug ),
			},
			this.focusCopyButton
		);
		const newSlug = this.state.slug.replace( REGEXP_NEWLINES, ' ' );
		this.props.onUpdate( newSlug );
	}

	/**
	 * Show a time-based confirmation when the copy button is clicked.
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
							isPrimary
							isLarge
						>
							{ __( 'Ok' ) }
						</Button>
					</form>
				}
				{ ! editingSlug &&
					<ClipboardButton
						className="editor-post-permalink__copy button"
						text={ link }
						onCopy={ this.onCopy }
						ref={ this.bindCopyButton }
						isPrimary
						isLarge
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
	},
	null,
	{ withRef: true }
)( PostPermalink );

