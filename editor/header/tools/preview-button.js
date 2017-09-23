/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { IconButton } from '@wordpress/components';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	getEditedPostPreviewLink,
	getEditedPostAttribute,
	isEditedPostDirty,
	isEditedPostNew,
	isEditedPostSaveable,
} from '../../selectors';
import { autosave } from '../../actions';

export class PreviewButton extends Component {
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
	}

	render() {
		const { link, isSaveable } = this.props;

		return (
			<IconButton
				href={ link }
				onClick={ this.saveForPreview }
				target={ this.getWindowTarget() }
				icon="visibility"
				disabled={ ! isSaveable }
			>
				{ _x( 'Preview', 'imperative verb' ) }
			</IconButton>
		);
	}
}

export default connect(
	( state ) => ( {
		postId: state.currentPost.id,
		link: getEditedPostPreviewLink( state ),
		isDirty: isEditedPostDirty( state ),
		isNew: isEditedPostNew( state ),
		isSaveable: isEditedPostSaveable( state ),
		modified: getEditedPostAttribute( state, 'modified' ),
	} ),
	{ autosave }
)( PreviewButton );
