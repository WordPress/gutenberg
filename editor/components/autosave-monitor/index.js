/**
 * WordPress dependencies
 */
import { Component, compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';

export class AutosaveMonitor extends Component {

	componentDidUpdate( prevProps ) {
		const { isDirty, isSaveable, isAutosavable } = this.props;
		if (
			prevProps.isDirty !== isDirty ||
			prevProps.isSaveable !== isSaveable ||
			prevProps.isAutosavable !== isAutosavable
		) {
			this.toggleTimer( isDirty && isSaveable && isAutosavable );
		}
	}

	componentWillUnmount() {
		this.toggleTimer( false );
	}

	toggleTimer( isPendingSave ) {
		clearTimeout( this.pendingSave );

		if ( isPendingSave ) {
			this.pendingSave = setTimeout(
				() => this.props.autosave(),
				10000
			);
		}
	}

	render() {
		return null;
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { isEditedPostDirty, isEditedPostSaveable, isPostAutosavable } = select( 'core/editor' );
		return {
			isDirty: isEditedPostDirty(),
			isSaveable: isEditedPostSaveable(),
			isAutosavable: isPostAutosavable(),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		autosave: dispatch( 'core/editor' ).doAutosave,
	} ) ),
] )( AutosaveMonitor );
