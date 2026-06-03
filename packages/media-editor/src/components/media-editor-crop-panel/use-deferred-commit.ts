/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	getInputBounds,
	getInputCommitValue,
	type CropInputRange,
} from './crop-input-utils';

export interface UseDeferredCommitArgs {
	value: number;
	range: CropInputRange;
	commitStep: number;
	onCommit: ( value: number ) => void;
	onCommitEnd?: () => void;
	/**
	 * Whether valid drafts should be committed on every change. Disable for
	 * controls that show a draft preview and commit only on blur/Enter.
	 */
	commitOnChange?: boolean;
	/**
	 * Called with the parsed draft value while `commitOnChange` is false.
	 * Receives `null` when the draft is not currently commit-valid.
	 */
	onPreview?: ( value: number | null ) => void;
	/**
	 * Called on focus, before any draft handling. Use to suspend
	 * side-effects that should treat the whole focus → blur cycle as one
	 * session — e.g. pausing the cropper's auto-history debounce.
	 */
	onSessionStart?: () => void;
	/**
	 * Called on blur, Enter, or Escape before `onCommitEnd`, even if the
	 * user did not change anything. Pair with `onSessionStart` to bound an
	 * edit session.
	 */
	onSessionEnd?: () => void;
}

export interface UseDeferredCommitReturn {
	value: string;
	min: number | undefined;
	max: number | undefined;
	onFocus: () => void;
	onBlur: () => void;
	onChange: ( next: string | undefined ) => void;
	onKeyDown: ( event: React.KeyboardEvent< HTMLInputElement > ) => void;
}

/**
 * Drive the numeric crop input's commit lifecycle from a single hook.
 *
 * Default mode is live commit: valid drafts fire `onCommit` on every change
 * so the canvas tracks typing. When `commitOnChange` is false, valid drafts
 * call `onPreview` instead and the real `onCommit` waits for blur/Enter —
 * use this for controls that paint a draft preview rectangle on the canvas
 * rather than mutating cropper state per keystroke.
 *
 * In both modes the displayed value is sovereign while focused: what the
 * user types stays, and the input is never replaced by an external state
 * change during a live-commit focus session. (Preview-mode focus sessions
 * are resync'd by the effect below when the cropper changes underneath.)
 *
 * On blur or Enter, a user-edited numeric draft is clamped to the current
 * bounds and committed, the session ends, and `onCommitEnd` (typically
 * `settleCrop`) fires once. Escape restores the value captured on focus.
 *
 * @param args                Hook arguments.
 * @param args.value
 * @param args.range
 * @param args.commitStep
 * @param args.onCommit
 * @param args.onCommitEnd
 * @param args.commitOnChange
 * @param args.onPreview
 * @param args.onSessionStart
 * @param args.onSessionEnd
 * @return Spreadable handlers + display value for a number input.
 */
export function useDeferredCommit( {
	value,
	range,
	commitStep,
	onCommit,
	onCommitEnd,
	commitOnChange = true,
	onPreview,
	onSessionStart,
	onSessionEnd,
}: UseDeferredCommitArgs ): UseDeferredCommitReturn {
	const [ focused, setFocused ] = useState( false );
	const [ draft, setDraft ] = useState( '' );
	const draftRef = useRef( '' );
	const skipBlurCommitRef = useRef( false );
	const initialValueRef = useRef( value );
	const lastCommittedDraftValueRef = useRef< number | null >( null );
	const hasPendingCommitEndRef = useRef( false );
	const hasUserEditedDraftRef = useRef( false );
	const onCommitEndRef = useRef( onCommitEnd );
	const onPreviewRef = useRef( onPreview );
	const onSessionEndRef = useRef( onSessionEnd );
	// Tracks whether `onSessionEnd` has already fired for the current focus
	// session, so Enter/Escape and the subsequent blur do not double-fire.
	const sessionEndedRef = useRef( true );
	const bounds = getInputBounds( value, range, commitStep );

	useEffect( () => {
		onCommitEndRef.current = onCommitEnd;
		onPreviewRef.current = onPreview;
		onSessionEndRef.current = onSessionEnd;
	}, [ onCommitEnd, onPreview, onSessionEnd ] );

	useEffect( () => {
		return () => {
			if ( sessionEndedRef.current ) {
				return;
			}
			sessionEndedRef.current = true;
			onPreviewRef.current?.( null );
			onSessionEndRef.current?.();
			if ( hasPendingCommitEndRef.current ) {
				onCommitEndRef.current?.();
				hasPendingCommitEndRef.current = false;
			}
		};
	}, [] );

	// Preview-mode resync: if the cropper changes underneath a focused
	// preview (rotation, undo, sibling commit), the visible draft no longer
	// corresponds to anything meaningful — the "baseline + edit" math
	// against the old `value` produces a preview rectangle that misrepresents
	// what would commit. Reset to the new baseline and clear the preview.
	// Live-commit mode keeps the typed draft because there, the draft IS the
	// commit and external state changes during focus are deliberately ignored.
	useEffect( () => {
		if (
			commitOnChange ||
			! focused ||
			bounds.value === initialValueRef.current
		) {
			return;
		}
		initialValueRef.current = bounds.value;
		lastCommittedDraftValueRef.current = null;
		hasPendingCommitEndRef.current = false;
		hasUserEditedDraftRef.current = false;
		draftRef.current = String( bounds.value );
		setDraft( String( bounds.value ) );
		onPreviewRef.current?.( null );
	}, [ bounds.value, commitOnChange, focused ] );

	const endSession = () => {
		if ( sessionEndedRef.current ) {
			return;
		}
		sessionEndedRef.current = true;
		onSessionEndRef.current?.();
	};

	const runCommitEnd = () => {
		if ( hasPendingCommitEndRef.current ) {
			onCommitEndRef.current?.();
			hasPendingCommitEndRef.current = false;
		}
	};

	const commitValue = (
		nextValue: string,
		options: { clampToBounds?: boolean; updateDraft?: boolean } = {}
	): boolean => {
		const commitValueCandidate = getInputCommitValue(
			nextValue,
			bounds,
			commitStep,
			options.clampToBounds
		);
		if ( commitValueCandidate === null ) {
			return false;
		}

		if ( options.updateDraft ) {
			draftRef.current = String( commitValueCandidate );
			setDraft( String( commitValueCandidate ) );
		}
		if ( lastCommittedDraftValueRef.current !== commitValueCandidate ) {
			onCommit( commitValueCandidate );
			hasPendingCommitEndRef.current = true;
		}
		lastCommittedDraftValueRef.current = commitValueCandidate;
		return true;
	};

	// Lightweight twin of `commitValue` — runs the same parse + step snap
	// but only notifies the consumer; the hook's commit bookkeeping
	// (lastCommittedDraftValueRef, hasPendingCommitEndRef) stays untouched
	// until blur/Enter.
	const previewValue = ( nextValue: string ) => {
		const previewValueCandidate = getInputCommitValue(
			nextValue,
			bounds,
			commitStep
		);
		onPreview?.( previewValueCandidate );
	};

	// Finalise on blur or Enter. Silently no-ops when the user didn't touch
	// the draft this session, so a focused-but-untouched input does not
	// overwrite an external state change (e.g. undo while focused).
	const completeDraft = () => {
		if ( ! hasUserEditedDraftRef.current ) {
			return;
		}

		commitValue( draftRef.current, {
			clampToBounds: true,
			updateDraft: true,
		} );
	};

	const onFocus = () => {
		initialValueRef.current = bounds.value;
		lastCommittedDraftValueRef.current = null;
		hasPendingCommitEndRef.current = false;
		hasUserEditedDraftRef.current = false;
		sessionEndedRef.current = false;
		setFocused( true );
		draftRef.current = String( bounds.value );
		setDraft( String( bounds.value ) );
		onSessionStart?.();
	};

	const onChange = ( nextValue: string | undefined ) => {
		const nextDraft = nextValue ?? '';
		if ( nextDraft !== draftRef.current ) {
			hasUserEditedDraftRef.current = true;
		}
		draftRef.current = nextDraft;
		setDraft( nextDraft );
		if ( commitOnChange ) {
			commitValue( nextDraft );
		} else {
			previewValue( nextDraft );
		}
	};

	const onBlur = () => {
		setFocused( false );
		if ( ! skipBlurCommitRef.current ) {
			completeDraft();
		}
		if ( ! commitOnChange ) {
			onPreview?.( null );
		}
		skipBlurCommitRef.current = false;
		// Session end before commit end: `onCommitEnd` typically calls
		// `settleCrop`, and the media editor's gesture boundary should be
		// closed first so the session flushes as one undo entry.
		endSession();
		runCommitEnd();
	};

	const onKeyDown = ( event: React.KeyboardEvent< HTMLInputElement > ) => {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
			skipBlurCommitRef.current = true;
			setFocused( false );
			completeDraft();
			if ( ! commitOnChange ) {
				onPreview?.( null );
			}
			endSession();
			runCommitEnd();
			event.currentTarget.blur();
		} else if ( event.key === 'Escape' ) {
			event.preventDefault();
			skipBlurCommitRef.current = true;
			setFocused( false );
			if ( lastCommittedDraftValueRef.current !== null ) {
				onCommit( initialValueRef.current );
				hasPendingCommitEndRef.current = true;
				lastCommittedDraftValueRef.current = null;
			}
			if ( ! commitOnChange ) {
				onPreview?.( null );
			}
			endSession();
			runCommitEnd();
			event.currentTarget.blur();
		}
	};

	return {
		value: focused ? draft : String( bounds.value ),
		// Always expose bounds. `getInputBounds` reports the actual commit
		// range even when the current value temporarily exceeds it (e.g.
		// transient post-rotation state), so the NumberControl's spinner and
		// keyboard arrows can't push the value out of range.
		min: bounds.min,
		max: bounds.max,
		onFocus,
		onBlur,
		onChange,
		onKeyDown,
	};
}
