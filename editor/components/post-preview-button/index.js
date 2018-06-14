/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, compose } from '@wordpress/element';
import { Button, ifCondition } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { DotTip } from '@wordpress/nux';

export class PostPreviewButton extends Component {
	constructor() {
		super( ...arguments );

		this.saveForPreview = this.saveForPreview.bind( this );

		this.state = {
			isAwaitingSave: false,
		};
	}

	componentWillReceiveProps( nextProps ) {
		const { modified, link } = nextProps;
		const { isAwaitingSave } = this.state;
		const hasFinishedSaving = (
			isAwaitingSave &&
			modified !== this.props.modified
		);

		if ( hasFinishedSaving && this.previewWindow ) {
			this.previewWindow.location = link;
			this.setState( { isAwaitingSave: false } );
		}
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
		this.setState( {
			isAwaitingSave: true,
		} );

		// Open a popup, BUT: Set it to a blank page until save completes. This
		// is necessary because popups can only be opened in response to user
		// interaction (click), but we must still wait for the post to save.
		event.preventDefault();
		this.previewWindow = window.open(
			'about:blank',
			this.getWindowTarget()
		);

		// When popup is closed, delete reference to avoid later assignment of
		// location in a post update.
		this.previewWindow.onbeforeunload = () => delete this.previewWindow;

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
	}

	render() {
		const { link, isSaveable } = this.props;

		return (
			<Button
				className="editor-post-preview"
				isLarge
				href={ link }
				onClick={ this.saveForPreview }
				target={ this.getWindowTarget() }
				disabled={ ! isSaveable }
			>
				{ _x( 'Preview', 'imperative verb' ) }
				<DotTip id="core/editor.preview">
					{ __( 'Click ‘Preview’ to load a preview of this page, so you can make sure you’re happy with your blocks.' ) }
				</DotTip>
			</Button>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			getCurrentPostId,
			getEditedPostPreviewLink,
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
			link: getEditedPostPreviewLink(),
			isDirty: isEditedPostDirty(),
			isNew: isEditedPostNew(),
			isSaveable: isEditedPostSaveable(),
			isViewable: get( postType, [ 'viewable' ], false ),
			modified: getEditedPostAttribute( 'modified' ),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		autosave: dispatch( 'core/editor' ).autosave,
	} ) ),
	ifCondition( ( { isViewable } ) => isViewable ),
] )( PostPreviewButton );
