/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export function AutosaveMonitor( props ) {
	const {
		autosave,
		isAutosaveable,
		isAutosaving,
		isDirty,
		interval,
		editsReference,
		disableIntervalChecks,
	} = props;

	const needsAutosaveRef = useRef( !! ( isDirty && isAutosaveable ) );
	const timerIdRef = useRef();

	// Keep the latest props and timer handler accessible to the scheduled
	// timer, which runs outside of React's render cycle.
	const propsRef = useRef( props );
	const autosaveTimerHandlerRef = useRef();

	const setAutosaveTimer = useCallback(
		( timeout = propsRef.current.interval * 1000 ) => {
			timerIdRef.current = setTimeout( () => {
				autosaveTimerHandlerRef.current();
			}, timeout );
		},
		[]
	);

	// Sync the refs after every render so the timer callback always reads the
	// latest props when it eventually fires.
	useEffect( () => {
		propsRef.current = props;
		autosaveTimerHandlerRef.current = () => {
			if ( ! propsRef.current.isAutosaveable ) {
				setAutosaveTimer( 1000 );
				return;
			}

			if ( needsAutosaveRef.current ) {
				needsAutosaveRef.current = false;
				propsRef.current.autosave();
			}

			setAutosaveTimer();
		};
	} );

	// Equivalent to `componentDidMount` / `componentWillUnmount`.
	useEffect( () => {
		if ( ! disableIntervalChecks ) {
			setAutosaveTimer();
		}

		return () => {
			clearTimeout( timerIdRef.current );
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// Equivalent to `componentDidUpdate`. A single effect preserves the exact
	// branch ordering of the original class component.
	const isMountedRef = useRef( false );
	const prevPropsRef = useRef( props );
	useEffect( () => {
		if ( ! isMountedRef.current ) {
			isMountedRef.current = true;
			prevPropsRef.current = props;
			return;
		}

		const prevProps = prevPropsRef.current;
		prevPropsRef.current = props;

		if ( disableIntervalChecks ) {
			if ( editsReference !== prevProps.editsReference ) {
				autosave();
			}
			return;
		}

		if ( interval !== prevProps.interval ) {
			clearTimeout( timerIdRef.current );
			setAutosaveTimer();
		}

		if ( ! isDirty ) {
			needsAutosaveRef.current = false;
			return;
		}

		if ( isAutosaving && ! prevProps.isAutosaving ) {
			needsAutosaveRef.current = false;
			return;
		}

		if ( editsReference !== prevProps.editsReference ) {
			needsAutosaveRef.current = true;
		}
	} );

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
