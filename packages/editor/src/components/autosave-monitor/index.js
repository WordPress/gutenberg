/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

export class AutosaveMonitor extends Component {
	componentDidUpdate( prevProps ) {
		const { isDirty, editsReference, isAutosaveable, isAutosaving } = this.props;

		// The edits reference is held for comparison to avoid scheduling an
		// autosave if an edit has not been made since the last autosave
		// completion. This is assigned when the autosave completes, and reset
		// when an edit occurs.
		//
		// See: https://github.com/WordPress/gutenberg/issues/12318

		if ( editsReference !== prevProps.editsReference ) {
			this.didAutosaveForEditsReference = false;
		}

		if ( ! isAutosaving && prevProps.isAutosaving ) {
			this.didAutosaveForEditsReference = true;
		}

		if (
			prevProps.isDirty !== isDirty ||
			prevProps.isAutosaveable !== isAutosaveable ||
			prevProps.editsReference !== editsReference
		) {
			this.toggleTimer(
				isDirty &&
				isAutosaveable &&
				! this.didAutosaveForEditsReference
			);
		}
	}

	componentWillUnmount() {
		this.toggleTimer( false );
	}

	toggleTimer( isPendingSave ) {
		clearTimeout( this.pendingSave );
		const { autosaveInterval } = this.props;
		if ( isPendingSave ) {
			this.pendingSave = setTimeout(
				() => this.props.autosave(),
				autosaveInterval * 1000
			);
		}
	}

	render() {
		return null;
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			isEditedPostDirty,
			isEditedPostAutosaveable,
			getReferenceByDistinctEdits,
			isAutosavingPost,
			getEditedPostAttribute,
			getCurrentPostId,
		} = select( 'core/editor' );
		const {
			getCurrentUser,
			getAutosave,
		} = select( 'core' );

		const { autosaveInterval } = select( 'core/editor' ).getEditorSettings();
		const postType = getEditedPostAttribute( 'type' );
		const postId = getCurrentPostId();
		const currentUser = getCurrentUser();
		const currentUserId = currentUser ? currentUser.id : null;
		const autosave = getAutosave( postType, postId, currentUserId );

		return {
			isDirty: isEditedPostDirty(),
			isAutosaveable: isEditedPostAutosaveable( autosave ),
			editsReference: getReferenceByDistinctEdits(),
			isAutosaving: isAutosavingPost(),
			autosaveInterval,
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		autosave: dispatch( 'core/editor' ).autosave,
	} ) ),
] )( AutosaveMonitor );
