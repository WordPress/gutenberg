/**
 * WordPress dependencies
 */
import { usePrevious, compose } from '@wordpress/compose';
import { useRef, useEffect } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import useScheduleSave from './use-scheduled-save';

export function AutosaveMonitor( props ) {
	const {
		isDirty,
		editsReference,
		isAutosaveable,
		isAutosaving,
		interval,
		autosave,
	} = props;
	const { scheduleSave, cancelSave } = useScheduleSave( interval, autosave );

	// The edits reference is held for comparison to avoid scheduling an
	// autosave if an edit has not been made since the last autosave
	// completion. This is assigned when the autosave completes, and reset
	// when an edit occurs.
	//
	// See: https://github.com/WordPress/gutenberg/issues/12318
	const didAutosaveForEditsReference = useRef();
	useEffect( () => {
		didAutosaveForEditsReference.current = false;
	}, [ editsReference ] );

	const prevIsAutosaving = usePrevious( isAutosaving );
	if ( ! isAutosaving && prevIsAutosaving ) {
		didAutosaveForEditsReference.current = true;
	}

	const firstRender = useRef( true );
	useEffect( () => {
		if ( firstRender.current ) {
			firstRender.current = false;
			return;
		}
		if (
			isDirty &&
			isAutosaveable &&
			! didAutosaveForEditsReference.current
		) {
			scheduleSave();
		} else {
			cancelSave();
		}
	}, [ isDirty, isAutosaveable, editsReference ] );

	return null;
}

export default compose( [
	withSelect( ( select, ownProps ) => {
		const { getReferenceByDistinctEdits } = select( 'core' );

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
