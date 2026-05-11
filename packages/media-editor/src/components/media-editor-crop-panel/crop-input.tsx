/**
 * WordPress dependencies
 */
import {
	__experimentalInputControlSuffixWrapper as InputControlSuffixWrapper,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	INPUT_VALUE_EPSILON,
	getInputBounds,
	getInputCommitValue,
	type CropInputRange,
} from './crop-input-utils';

interface CropInputProps {
	label: string;
	'aria-label'?: string;
	value: number;
	range: CropInputRange;
	disabled?: boolean;
	/** Display step used by the underlying NumberControl (arrow-key increment). */
	step?: number;
	/** Snap granularity applied when a value is committed. Defaults to `step`. */
	commitStep?: number;
	suffix?: React.ReactNode;
	onCommit: ( value: number ) => void;
	onCommitEnd?: () => void;
}

const COMMIT_IDLE_DELAY_MS = 300;
const PX_SUFFIX = <InputControlSuffixWrapper>px</InputControlSuffixWrapper>;

/**
 * Numeric crop control with live preview and deferred finalization.
 *
 * Valid drafts call `onCommit` immediately so the canvas updates while typing
 * or using spinner controls. Completion signals (idle, blur, Enter) clamp the
 * draft to the final bounds and call `onCommitEnd` once, letting callers settle
 * crop state or flush history without creating an undo step per keystroke.
 * Escape restores the value captured on focus.
 *
 * @param props Component props.
 * @return Rendered number control.
 */
export default function CropInput( props: CropInputProps ) {
	const {
		label,
		'aria-label': ariaLabel,
		value,
		range,
		disabled = false,
		step = 1,
		commitStep = step,
		suffix = PX_SUFFIX,
		onCommit,
		onCommitEnd,
	} = props;
	const [ focused, setFocused ] = useState( false );
	const [ draft, setDraft ] = useState( '' );
	const draftRef = useRef( '' );
	const skipBlurCommitRef = useRef( false );
	const initialValueRef = useRef( value );
	const lastCommittedDraftValueRef = useRef< number | null >( null );
	const hasPendingCommitEndRef = useRef( false );
	const commitEndDelayRef = useRef<
		ReturnType< typeof setTimeout > | undefined
	>( undefined );
	const bounds = getInputBounds( value, range, commitStep );

	const clearCommitEndDelay = () => {
		clearTimeout( commitEndDelayRef.current );
	};

	const runCommitEnd = () => {
		clearCommitEndDelay();
		if ( hasPendingCommitEndRef.current ) {
			onCommitEnd?.();
			hasPendingCommitEndRef.current = false;
		}
	};

	useEffect( () => {
		return () => {
			clearTimeout( commitEndDelayRef.current );
		};
	}, [] );

	useEffect( () => {
		if ( ! focused ) {
			return;
		}

		// Undo/redo and other external crop changes should replace the focused
		// draft. A value this input just committed is ignored so typing does not
		// constantly reset to the formatted prop value.
		if (
			lastCommittedDraftValueRef.current !== null &&
			Math.abs( bounds.value - lastCommittedDraftValueRef.current ) <
				INPUT_VALUE_EPSILON
		) {
			return;
		}

		clearTimeout( commitEndDelayRef.current );
		initialValueRef.current = bounds.value;
		lastCommittedDraftValueRef.current = null;
		hasPendingCommitEndRef.current = false;
		draftRef.current = String( bounds.value );
		setDraft( String( bounds.value ) );
	}, [ focused, bounds.value ] );

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

	const finalizeDraft = () => {
		commitValue( draftRef.current, {
			clampToBounds: true,
			updateDraft: true,
		} );
		runCommitEnd();
	};

	const scheduleDraftFinalization = () => {
		clearCommitEndDelay();
		commitEndDelayRef.current = setTimeout(
			finalizeDraft,
			COMMIT_IDLE_DELAY_MS
		);
	};

	const handleFocus = () => {
		initialValueRef.current = bounds.value;
		lastCommittedDraftValueRef.current = null;
		hasPendingCommitEndRef.current = false;
		setFocused( true );
		draftRef.current = String( bounds.value );
		setDraft( String( bounds.value ) );
	};

	const handleChange = ( nextValue: string | undefined ) => {
		const nextDraft = nextValue ?? '';
		clearCommitEndDelay();
		draftRef.current = nextDraft;
		setDraft( nextDraft );
		commitValue( nextDraft );
		scheduleDraftFinalization();
	};

	const handleBlur = () => {
		setFocused( false );
		if ( skipBlurCommitRef.current ) {
			skipBlurCommitRef.current = false;
			return;
		}
		commitValue( draft, { clampToBounds: true, updateDraft: true } );
		runCommitEnd();
	};

	const handleKeyDown = (
		event: React.KeyboardEvent< HTMLInputElement >
	) => {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
			skipBlurCommitRef.current = true;
			setFocused( false );
			commitValue( draft, { clampToBounds: true, updateDraft: true } );
			runCommitEnd();
			event.currentTarget.blur();
		} else if ( event.key === 'Escape' ) {
			event.preventDefault();
			skipBlurCommitRef.current = true;
			setFocused( false );
			clearCommitEndDelay();
			if ( lastCommittedDraftValueRef.current !== null ) {
				onCommit( initialValueRef.current );
				hasPendingCommitEndRef.current = true;
				runCommitEnd();
				lastCommittedDraftValueRef.current = null;
			}
			event.currentTarget.blur();
		}
	};

	return (
		<NumberControl
			__next40pxDefaultSize
			label={ label }
			aria-label={ ariaLabel }
			value={ focused ? draft : String( bounds.value ) }
			min={ focused ? undefined : bounds.min }
			max={ focused ? undefined : bounds.max }
			step={ step }
			disabled={ disabled }
			onChange={ handleChange }
			onFocus={ handleFocus }
			onBlur={ handleBlur }
			onKeyDown={ handleKeyDown }
			suffix={ suffix }
		/>
	);
}
