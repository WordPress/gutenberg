/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

/**
 * External dependencies
 */
import RNReactNativeGutenbergBridge from 'react-native-gutenberg-bridge';

export class AutosaveMonitor extends Component {
	componentDidUpdate( prevProps ) {
		const { isDirty, editsReference, isAutosaving } = this.props;

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
			prevProps.editsReference !== editsReference
		) {
			this.toggleTimer(
				isDirty &&
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
				() => {
					RNReactNativeGutenbergBridge.editorDidAutosave();
				},
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
			getReferenceByDistinctEdits,
			isAutosavingPost,
		} = select( 'core/editor' );

		const autosaveInterval = 2; // This value should be read from editor settings

		return {
			isDirty: isEditedPostDirty(),
			editsReference: getReferenceByDistinctEdits(),
			isAutosaving: isAutosavingPost(),
			autosaveInterval,
		};
	} ),
] )( AutosaveMonitor );
