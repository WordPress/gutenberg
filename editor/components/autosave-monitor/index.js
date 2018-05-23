/**
 * WordPress dependencies
 */
import { Component, compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';

export class AutosaveMonitor extends Component {
	componentDidUpdate( prevProps ) {
		const { isDirty, isSaveable, isAutosaveable, isAutosaving } = this.props;

		// Prevent autosaves if an autosave is in progress.
		if ( isAutosaving ) {
			return;
		}
		if (
			prevProps.isDirty !== isDirty ||
			prevProps.isSaveable !== isSaveable ||
			prevProps.isAutosaveable !== isAutosaveable
		) {
			this.toggleTimer( isDirty && isSaveable && isAutosaveable );
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
			isEditedPostSaveable,
			isPostAutosaveable,
			getEditorSettings,
			isAutosavingPost,
		} = select( 'core/editor' );
		const { autosaveInterval } = getEditorSettings();
		return {
			isDirty: isEditedPostDirty(),
			isSaveable: isEditedPostSaveable(),
			isAutosaveable: isPostAutosaveable(),
			autosaveInterval: autosaveInterval,
			isAutosaving: isAutosavingPost(),
		};
	} ),

	withDispatch( ( dispatch ) => ( {
		autosave: dispatch( 'core/editor' ).doAutosave,
	} ) ),
] )( AutosaveMonitor );
