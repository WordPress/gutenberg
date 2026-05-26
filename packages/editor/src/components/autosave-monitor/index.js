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
	const needsAutosave = useRef( !! ( isDirty && isAutosaveable ) );
	const timerId = useRef( null );

	const latestIsAutosaveable = useRef( isAutosaveable );
	const latestInterval = useRef( interval );
	const latestAutosave = useRef( autosave );

	// Update refs inside useEffect — not during render.
	useEffect( () => {
		latestIsAutosaveable.current = isAutosaveable;
		latestInterval.current = interval;
		latestAutosave.current = autosave;
	}, [ isAutosaveable, interval, autosave ] );

	const setAutosaveTimer = useCallback( ( timeout ) => {
		const ms =
			timeout !== undefined ? timeout : latestInterval.current * 1000;
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
	// componentWillUnmount: clear timer.
	useEffect( () => {
		if ( ! disableIntervalChecks ) {
			setAutosaveTimer();
		}
		return () => clearTimeout( timerId.current );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// Restart timer when interval changes.
	const prevIntervalRef = useRef( interval );
	useEffect( () => {
		if ( interval === prevIntervalRef.current ) {
			return;
		}
		prevIntervalRef.current = interval;
		clearTimeout( timerId.current );
		setAutosaveTimer();
	}, [ interval, setAutosaveTimer ] );

	// Track dirty state, autosaving, and edit changes.
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
	}, [
		isDirty,
		isAutosaving,
		editsReference,
		disableIntervalChecks,
		autosave,
	] );

	return null;
}

/**
 * Monitors the changes made to the edited post and triggers autosave if necessary.
 *
 * The logic is straightforward: a check is performed every `props.interval` seconds. If any changes are detected, `props.autosave()` is called.
 * The time between the change and the autosave varies but is no larger than `props.interval` seconds. Refer to the code below for more details, such as
 * the specific way of detecting changes.
 *
 * There are two caveats:
 * * If `props.isAutosaveable` happens to be false at a time of checking for changes, the check is retried every second.
 * * The timer may be disabled by setting `props.disableIntervalChecks` to `true`. In that mode, any change will immediately trigger `props.autosave()`.
 *
 * @param {Object}   props                       - The properties passed to the component.
 * @param {Function} props.autosave              - The function to call when changes need to be saved.
 * @param {number}   props.interval              - The maximum time in seconds between an unsaved change and an autosave.
 * @param {boolean}  props.isAutosaveable        - If false, the check for changes is retried every second.
 * @param {boolean}  props.disableIntervalChecks - If true, disables the timer and any change will immediately trigger `props.autosave()`.
 * @param {boolean}  props.isDirty               - Indicates if there are unsaved changes.
 *
 * @example
 * ```jsx
 * <AutosaveMonitor interval={30000} />
 * ```
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