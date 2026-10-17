import { createElement, useEffect, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Calls `callback` every `intervalInSeconds`. The latest `callback` is always
 * invoked without resetting the timer.
 *
 * @param {Function} callback          Function to call on each tick.
 * @param {number}   intervalInSeconds Seconds between ticks.
 */
function useInterval( callback, intervalInSeconds ) {
	const callbackRef = useRef( callback );

	useEffect( () => {
		callbackRef.current = callback;
	}, [ callback ] );

	useEffect( () => {
		// Interval can be undefined before editor settings are populated.
		if ( ! intervalInSeconds ) {
			return;
		}

		const id = setInterval(
			() => callbackRef.current(),
			intervalInSeconds * 1000
		);
		return () => clearInterval( id );
	}, [ intervalInSeconds ] );
}

/**
 * Autosaves through a custom `autosave` function, checking the post every
 * interval.
 *
 * @param {Object}   props          The component props.
 * @param {number}   props.interval Time in seconds between checks.
 * @param {Function} props.autosave Function to call when changes need to be saved.
 */
function IntervalAutosaveMonitor( { interval, autosave } ) {
	const { getReferenceByDistinctEdits } = useSelect( coreStore );
	const { isEditedPostDirty, isEditedPostAutosaveable, isAutosavingPost } =
		useSelect( editorStore );

	// Reference of the edits last considered for autosaving. Mutable state that
	// must not trigger a re-render, hence a ref.
	const lastEditsReferenceRef = useRef();

	useInterval( () => {
		// The post can't be autosaved yet (e.g. its existing autosave is still
		// loading). Keep any pending edits and try again on the next tick.
		if ( ! isEditedPostAutosaveable() ) {
			return;
		}

		const editsReference = getReferenceByDistinctEdits();
		const hasNewEdits = editsReference !== lastEditsReferenceRef.current;
		if ( hasNewEdits && isEditedPostDirty() && ! isAutosavingPost() ) {
			// Only consume the edits reference when we autosave,
			// so edits made during an in-flight autosave aren't skipped.
			lastEditsReferenceRef.current = editsReference;
			autosave();
		}
	}, interval );

	return null;
}

/**
 * Autosaves to the server once `interval` seconds have passed while an
 * autosave is needed. The time of the next autosave is stored in the editor
 * store, so the countdown in the notice matches the request that follows.
 *
 * @param {Object} props          The component props.
 * @param {number} props.interval Time in seconds between autosaves.
 */
function ScheduledAutosaveMonitor( { interval } ) {
	const { autosave } = useDispatch( editorStore );
	const { setNextAutosaveTime } = unlock( useDispatch( editorStore ) );
	const { getReferenceByDistinctEdits } = useSelect( coreStore );

	// Reference of the edits last sent in an autosave.
	const lastEditsReferenceRef = useRef();

	const { isSaving, needsAutosave } = useSelect( ( select ) => {
		const {
			isEditedPostDirty,
			isEditedPostAutosaveable,
			isSavingPost,
			didPostSaveRequestFail,
		} = select( editorStore );
		return {
			isSaving: isSavingPost(),
			needsAutosave:
				isEditedPostDirty() &&
				isEditedPostAutosaveable() &&
				( select( coreStore ).getReferenceByDistinctEdits() !==
					lastEditsReferenceRef.current ||
					didPostSaveRequestFail() ),
		};
	}, [] );

	useEffect( () => {
		if ( isSaving || ! needsAutosave || ! interval ) {
			return;
		}
		setNextAutosaveTime( Date.now() + interval * 1000 );
		const timeout = setTimeout( () => {
			autosave();
			lastEditsReferenceRef.current = getReferenceByDistinctEdits();
		}, interval * 1000 );
		return () => {
			clearTimeout( timeout );
			setNextAutosaveTime( null );
		};
	}, [
		isSaving,
		needsAutosave,
		interval,
		autosave,
		getReferenceByDistinctEdits,
		setNextAutosaveTime,
	] );

	return null;
}

/**
 * Monitors the changes made to the edited post and triggers autosave if necessary.
 *
 * The post is autosaved every `interval` seconds while there is something new to save,
 * and retried every `interval` seconds after a failure.
 *
 * @param {Object}   props            The component props.
 * @param {number}   [props.interval] Time in seconds between checks. Defaults to the editor's
 *                                    `autosaveInterval` setting.
 * @param {Function} [props.autosave] Function to call when changes need to be saved. Defaults to the
 *                                    editor store's `autosave` action.
 *
 * @example
 * ```jsx
 * <AutosaveMonitor interval={ 30 } />
 * ```
 */
export default function AutosaveMonitor( { interval, autosave } ) {
	const autosaveInterval = useSelect(
		( select ) => {
			if ( interval !== undefined ) {
				return interval;
			}

			return select( editorStore ).getEditorSettings().autosaveInterval;
		},
		[ interval ]
	);

	if ( autosave ) {
		return createElement( IntervalAutosaveMonitor, {
			interval: autosaveInterval,
			autosave,
		} );
	}

	return createElement( ScheduledAutosaveMonitor, {
		interval: autosaveInterval,
	} );
}
