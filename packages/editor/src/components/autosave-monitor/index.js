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
	isAutosaving,
	isAutosaveable,
	interval,
	autosave,
} ) {
	const [ throttledSave, cancelSave ] = useThrottle( autosave, interval );

	useEffect( () => {
		if ( isDirty && isAutosaveable ) {
			// If there is an autosave already running, let's delay scheduling additional ones
			// until after it's finished - the effect will run again when that happens.
			if ( ! isAutosaving ) {
				throttledSave();
			}
		} else {
			cancelSave();
		}
	}, [ isDirty, isAutosaveable, isAutosaving ] );

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
