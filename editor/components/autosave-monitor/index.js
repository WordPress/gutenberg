/**
 * External Dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, compose } from '@wordpress/element';
import { ifCondition } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';

export class AutosaveMonitor extends Component {
	componentDidUpdate( prevProps ) {
		const { isDirty, isAutosaveable } = this.props;

		if (
			prevProps.isDirty !== isDirty ||
			prevProps.isAutosaveable !== isAutosaveable
		) {
			this.toggleTimer( isDirty && isAutosaveable );
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
			getEditorSettings,
			getEditedPostAttribute,
		} = select( 'core/editor' );
		const { getPostType } = select( 'core' );
		const { autosaveInterval } = getEditorSettings();
		const postType = getPostType( getEditedPostAttribute( 'type' ) );
		return {
			isDirty: isEditedPostDirty(),
			isAutosaveable: isEditedPostAutosaveable(),
			autosaveInterval,
			isPostSaveable: get( postType, [ 'saveable' ], true ),
			isPostAutosaveable: get( postType, [ 'autosaveable' ], true ),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		autosave: dispatch( 'core/editor' ).autosave,
	} ) ),
	ifCondition( ( { isPostSaveable, isPostAutosaveable } ) => isPostSaveable && isPostAutosaveable ),
] )( AutosaveMonitor );
