/**
 * WordPress dependencies
 */
import { useEffect, useRef, useCallback } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export function AutosaveMonitor( {
	isDirty,
	isAutosaveable,
	isAutosaving,
	editsReference,
	interval,
	autosave,
	disableIntervalChecks,
} ) {
	// Mutable values that should NOT trigger re-renders — same as class instance vars.
	const needsAutosave = useRef( !! ( isDirty && isAutosaveable ) );
	const timerId = useRef( null );

	// Refs to always-fresh prop values so setTimeout callbacks never close over stale values.
	const latestIsAutosaveable = useRef( isAutosaveable );
	const latestInterval = useRef( interval );
	const latestAutosave = useRef( autosave );
	latestIsAutosaveable.current = isAutosaveable;
	latestInterval.current = interval;
	latestAutosave.current = autosave;

	// Stable function — never recreated, always reads latest values via refs.
	const setAutosaveTimer = useCallback( ( timeout ) => {
		const ms = timeout !== undefined ? timeout : latestInterval.current * 1000;
		timerId.current = setTimeout( () => {
			if ( ! latestIsAutosaveable.current ) {
				setAutosaveTimer( 1000 );
				return;
			}
			if ( needsAutosave.current ) {
				needsAutosave.current = false;
				latestAutosave.current();
			}
			setAutosaveTimer();
		}, ms );
	}, [] );

	// componentDidMount: start timer.
	// componentWillUnmount: clear timer (the return cleanup).
	useEffect( () => {
		if ( ! disableIntervalChecks ) {
			setAutosaveTimer();
		}
		return () => clearTimeout( timerId.current );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// componentDidUpdate — interval changed: restart timer.
	const prevIntervalRef = useRef( interval );
	useEffect( () => {
		if ( interval === prevIntervalRef.current ) {
			return;
		}
		prevIntervalRef.current = interval;
		clearTimeout( timerId.current );
		setAutosaveTimer();
	}, [ interval, setAutosaveTimer ] );

	// componentDidUpdate — track dirty state, autosaving, and edit changes.
	const prevIsAutosavingRef = useRef( isAutosaving );
	const prevEditsReferenceRef = useRef( editsReference );
	useEffect( () => {
		const prevIsAutosaving = prevIsAutosavingRef.current;
		const prevEditsReference = prevEditsReferenceRef.current;
		prevIsAutosavingRef.current = isAutosaving;
		prevEditsReferenceRef.current = editsReference;

		if ( disableIntervalChecks ) {
			if ( editsReference !== prevEditsReference ) {
				autosave();
			}
			return;
		}

		if ( ! isDirty ) {
			needsAutosave.current = false;
			return;
		}

		if ( isAutosaving && ! prevIsAutosaving ) {
			needsAutosave.current = false;
			return;
		}

		if ( editsReference !== prevEditsReference ) {
			needsAutosave.current = true;
		}
	}, [ isDirty, isAutosaving, editsReference, disableIntervalChecks, autosave ] );

	return null;
}

/**
 * Monitors the changes made to the edited post and triggers autosave if necessary.
 * ...existing JSDoc stays exactly as is...
 */
export default compose( [
	withSelect( ( select, ownProps ) => {
		const { getReferenceByDistinctEdits } = select( coreStore );
		const {
			isEditedPostDirty,
			isEditedPostAutosaveable,
			isAutosavingPost,
			getEditorSettings,
		} = select( editorStore );
		const { interval = getEditorSettings().autosaveInterval } = ownProps;
		return {
			editsReference: getReferenceByDistinctEdits(),
			isDirty: isEditedPostDirty(),
			isAutosaveable: isEditedPostAutosaveable(),
			isAutosaving: isAutosavingPost(),
			interval,
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => ( {
		autosave() {
			const { autosave = dispatch( editorStore ).autosave } = ownProps;
			autosave();
		},
	} ) ),
] )( AutosaveMonitor );