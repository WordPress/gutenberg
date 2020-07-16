/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import useThrottle from './use-throttle';

export function AutosaveMonitor( {
	isDirty,
	isAutosaveable,
	interval,
	autosave,
} ) {
	const { scheduleSave, cancelSave } = useThrottle( autosave, interval );

	useEffect( () => {
		if ( isDirty && isAutosaveable ) {
			scheduleSave();
		} else {
			cancelSave();
		}
	}, [ isDirty, isAutosaveable ] );

	return null;
}

export default compose( [
	withSelect( ( select, ownProps ) => {
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
