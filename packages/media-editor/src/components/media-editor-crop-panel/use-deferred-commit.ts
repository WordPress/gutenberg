/**
 * WordPress dependencies
 */
import { useRef, useState } from '@wordpress/element';

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
 * Drive the numeric crop input's preview-on-type and single-undo-step
 * behaviour from a single hook.
 *
 * The contract while focused is simple: what the user types stays. Live
 * commits push valid in-range drafts to state so the canvas preview tracks
 * typing, but the displayed value is never replaced by anything external
 * during focus — not idle, not a sibling control's commit, not the cropper's
 * own clamping, not undo/redo. Out-of-range drafts are ignored by the canvas
 * and remain editable until the user explicitly leaves the field.
 *
 * On blur or Enter, a user-edited numeric draft is clamped to the current
 * bounds and committed, and `onCommitEnd` (typically `settleCrop` or
 * `commitHistory`) fires once. Escape restores the value captured on focus.
 *
 * @param args             Hook arguments.
 * @param args.value
 * @param args.range
 * @param args.commitStep
 * @param args.onCommit
 * @param args.onCommitEnd
 * @return Spreadable handlers + display value for a number input.
 */
export function useDeferredCommit( {
	value,
	range,
	commitStep,
	onCommit,
	onCommitEnd,
}: UseDeferredCommitArgs ): UseDeferredCommitReturn {
	const [ focused, setFocused ] = useState( false );
	const [ draft, setDraft ] = useState( '' );
	const draftRef = useRef( '' );
	const skipBlurCommitRef = useRef( false );
	const initialValueRef = useRef( value );
	const lastCommittedDraftValueRef = useRef< number | null >( null );
	const hasPendingCommitEndRef = useRef( false );
	const hasUserEditedDraftRef = useRef( false );
	const bounds = getInputBounds( value, range, commitStep );

	const runCommitEnd = () => {
		if ( hasPendingCommitEndRef.current ) {
			onCommitEnd?.();
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

	const completeDraft = () => {
		if ( ! hasUserEditedDraftRef.current ) {
			return;
		}

		commitValue( draftRef.current, {
			clampToBounds: true,
			updateDraft: true,
		} );
		runCommitEnd();
	};

	const onFocus = () => {
		initialValueRef.current = bounds.value;
		lastCommittedDraftValueRef.current = null;
		hasPendingCommitEndRef.current = false;
		hasUserEditedDraftRef.current = false;
		setFocused( true );
		draftRef.current = String( bounds.value );
		setDraft( String( bounds.value ) );
	};

	const onChange = ( nextValue: string | undefined ) => {
		const nextDraft = nextValue ?? '';
		if ( nextDraft !== draftRef.current ) {
			hasUserEditedDraftRef.current = true;
		}
		draftRef.current = nextDraft;
		setDraft( nextDraft );
		commitValue( nextDraft );
	};

	const onBlur = () => {
		setFocused( false );
		if ( skipBlurCommitRef.current ) {
			skipBlurCommitRef.current = false;
			return;
		}
		completeDraft();
	};

	const onKeyDown = ( event: React.KeyboardEvent< HTMLInputElement > ) => {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
			skipBlurCommitRef.current = true;
			setFocused( false );
			completeDraft();
			event.currentTarget.blur();
		} else if ( event.key === 'Escape' ) {
			event.preventDefault();
			skipBlurCommitRef.current = true;
			setFocused( false );
			if ( lastCommittedDraftValueRef.current !== null ) {
				onCommit( initialValueRef.current );
				hasPendingCommitEndRef.current = true;
				runCommitEnd();
				lastCommittedDraftValueRef.current = null;
			}
			event.currentTarget.blur();
		}
	};

	return {
		value: focused ? draft : String( bounds.value ),
		min: focused ? undefined : bounds.min,
		max: focused ? undefined : bounds.max,
		onFocus,
		onBlur,
		onChange,
		onKeyDown,
	};
}
