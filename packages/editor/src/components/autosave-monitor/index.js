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
		const { interval, shouldThrottle = false } = this.props;

		// By default, AutosaveMonitor will wait for a pause in editing before
		// autosaving. In other words, its action is "debounced".
		//
		// The `shouldThrottle` props allows overriding this behaviour, thus
		// making the autosave action "throttled".
		if ( ! shouldThrottle && this.pendingSave ) {
			clearTimeout( this.pendingSave );
			delete this.pendingSave;
		}

		if ( isPendingSave && ! ( shouldThrottle && this.pendingSave ) ) {
			this.pendingSave = setTimeout(
				() => {
					this.props.autosave();
					delete this.pendingSave;
				},
				interval * 1000
			);
		}
	}

	render() {
		return null;
	}
}

export default compose( [
	withSelect( ( select, ownProps ) => {
		const {
			getReferenceByDistinctEdits,
		} = select( 'core' );

		const {
			isEditedPostDirty,
			isEditedPostAutosaveable,
			isAutosavingPost,
			getEditorSettings,
		} = select( 'core/editor' );

		const { interval = getEditorSettings().autosaveInterval } = ownProps;

		return {
			isDirty: isEditedPostDirty(),
			isAutosaveable: isEditedPostAutosaveable(),
			editsReference: getReferenceByDistinctEdits(),
			isAutosaving: isAutosavingPost(),
			interval,
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => ( {
		autosave() {
			const { autosave = dispatch( 'core/editor' ).autosave } = ownProps;
			autosave();
		},
	} ) ),
] )( AutosaveMonitor );
