/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, compose } from '@wordpress/element';
import { Button, ifCondition } from '@wordpress/components';
import { _x } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';

export class PostPreviewButton extends Component {
	constructor() {
		super( ...arguments );

		this.saveForPreview = this.saveForPreview.bind( this );
	}

	componentDidUpdate( prevProps ) {
		const { previewLink } = this.props;

		// This relies on the window being responsible to unset itself when
		// navigation occurs or a new preview window is opened, to avoid
		// unintentional forceful redirects.
		if ( previewLink && previewLink !== prevProps.previewLink ) {
			this.setPreviewWindowLink( previewLink );
		}
	}

	/**
	 * Sets the preview window's location to the given URL, if a preview window
	 * exists and is not already at that location.
	 *
	 * @param {string} url URL to assign as preview window location.
	 */
	setPreviewWindowLink( url ) {
		const { previewWindow } = this;
		if ( ! previewWindow || previewWindow.location.href === url ) {
			return;
		}

		previewWindow.location = url;
	}

	getWindowTarget() {
		const { postId } = this.props;
		return `wp-preview-${ postId }`;
	}

	saveForPreview( event ) {
		const { isDirty, isNew } = this.props;

		// Let default link behavior occur if no changes to saved post
		if ( ! isDirty && ! isNew ) {
			return;
		}

		// Save post prior to opening window
		this.props.autosave();

		// Open a popup, BUT: Set it to a blank page until save completes. This
		// is necessary because popups can only be opened in response to user
		// interaction (click), but we must still wait for the post to save.
		event.preventDefault();
		this.previewWindow = window.open(
			'about:blank',
			this.getWindowTarget()
		);

		const markup = `
			<div>
				<p>Please wait&hellip;</p>
				<p>Generating preview.</p>
			</div>
			<style>
				body {
					margin: 0;
				}
				div {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					height: 100vh;
					width: 100vw;
				}
				p {
					text-align: center;
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
				}
			</style>`;

		this.previewWindow.document.write( markup );
		this.previewWindow.document.close();

		// When popup is closed or redirected by setPreviewWindowLink, delete
		// reference to avoid later assignment of location in a post update.
		this.previewWindow.onbeforeunload = () => delete this.previewWindow;
	}

	render() {
		const { currentPostLink, isSaveable } = this.props;

		return (
			<Button
				className="editor-post-preview"
				isLarge
				href={ currentPostLink }
				onClick={ this.saveForPreview }
				target={ this.getWindowTarget() }
				disabled={ ! isSaveable }
			>
				{ _x( 'Preview', 'imperative verb' ) }
			</Button>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			getCurrentPostId,
			getCurrentPostAttribute,
			getAutosaveAttribute,
			getEditedPostAttribute,
			isEditedPostDirty,
			isEditedPostNew,
			isEditedPostSaveable,
		} = select( 'core/editor' );
		const {
			getPostType,
		} = select( 'core' );
		const postType = getPostType( getEditedPostAttribute( 'type' ) );
		return {
			postId: getCurrentPostId(),
			currentPostLink: getCurrentPostAttribute( 'link' ),
			previewLink: getAutosaveAttribute( 'preview_link' ),
			isDirty: isEditedPostDirty(),
			isNew: isEditedPostNew(),
			isSaveable: isEditedPostSaveable(),
			isViewable: get( postType, [ 'viewable' ], false ),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		autosave: dispatch( 'core/editor' ).autosave,
	} ) ),
	ifCondition( ( { isViewable } ) => isViewable ),
] )( PostPreviewButton );
