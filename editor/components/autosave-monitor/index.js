/**
 * WordPress dependencies
 */
import { Component, compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';

export class AutosaveMonitor extends Component {
	componentDidUpdate( prevProps ) {
		const { isDirty, isSaveable, isAutosaveable } = this.props;
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
		const { editorSettings } = this.props;
		if ( isPendingSave ) {
			this.pendingSave = setTimeout(
				() => this.props.autosave(),
				editorSettings.autosaveInterval * 1000
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
		} = select( 'core/editor' );
		return {
			isDirty: isEditedPostDirty(),
			isSaveable: isEditedPostSaveable(),
			isAutosaveable: isPostAutosaveable(),
			editorSettings: getEditorSettings(),
		};
	} ),

	withDispatch( ( dispatch ) => ( {
		autosave: dispatch( 'core/editor' ).doAutosave,
	} ) ),
] )( AutosaveMonitor );
