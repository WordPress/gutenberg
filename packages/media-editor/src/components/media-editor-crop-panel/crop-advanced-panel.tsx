/**
 * WordPress dependencies
 */
import {
	__experimentalInputControlSuffixWrapper as InputControlSuffixWrapper,
	__experimentalNumberControl as NumberControl,
	Flex,
	FlexItem,
	PanelBody,
} from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useCropper } from '../../image-editor';
import { MAX_ROTATION_OFFSET } from '../../image-editor/core/constants';
import {
	cropPixelRectToNormalizedRect,
	validateCropPixelRectAgainstBounds,
	type CropPixelRectBounds,
	type CropPixelRect,
	type CropPixelRectInput,
} from '../../image-editor/core/crop-geometry';
import { useCropGeometry } from '../../image-editor/react/hooks/use-crop-geometry';
import { useCropGestureHandlers } from '../../hooks/use-crop-gesture-handlers';

interface CropAdvancedPanelProps {
	aspectRatio?: number;
	freeformCrop: boolean;
	onPlacementControlInteraction?: () => void;
}

interface CropInputRange {
	minValue: number;
	maxValue: number;
	isEditable: boolean;
}

interface CropInputBounds {
	value: number;
	min: number;
	max: number;
}

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

const INPUT_VALUE_EPSILON = 1e-6;
const COMMIT_IDLE_DELAY_MS = 300;
const FINE_ROTATION_COMMIT_STEP = 0.5;
const PX_SUFFIX = <InputControlSuffixWrapper>px</InputControlSuffixWrapper>;
const DEGREE_SUFFIX = (
	<InputControlSuffixWrapper>{ '\u00b0' }</InputControlSuffixWrapper>
);

function getStepPrecision( step: number ): number {
	const stepString = step.toString();
	const decimalIndex = stepString.indexOf( '.' );
	return decimalIndex === -1 ? 0 : stepString.length - decimalIndex - 1;
}

function snapInputValueToStep( value: number, step: number ): number {
	const precision = getStepPrecision( step );
	const snapped = Math.round( value / step ) * step;
	return Number( snapped.toFixed( precision ) );
}

function roundIfNearStep( value: number, step: number ): number {
	const snapped = snapInputValueToStep( value, step );
	return Math.abs( value - snapped ) < INPUT_VALUE_EPSILON ? snapped : value;
}

function ceilInputValueToStep( value: number, step: number ): number {
	return snapInputValueToStep(
		Math.ceil( roundIfNearStep( value, step ) / step ) * step,
		step
	);
}

function floorInputValueToStep( value: number, step: number ): number {
	return snapInputValueToStep(
		Math.floor( roundIfNearStep( value, step ) / step ) * step,
		step
	);
}

function makeRange(
	minValue: number,
	maxValue: number,
	isEditable = true
): CropInputRange {
	const max = Math.max( minValue, maxValue );
	return {
		minValue,
		maxValue: max,
		isEditable: isEditable && max > minValue,
	};
}

function getInputBounds(
	value: number,
	range: CropInputRange,
	commitStep: number
): CropInputBounds {
	const snapped = snapInputValueToStep( value, commitStep );
	const min = ceilInputValueToStep( range.minValue, commitStep );
	const max = floorInputValueToStep( range.maxValue, commitStep );

	if ( max < min ) {
		return {
			value: snapped,
			min: snapped,
			max: snapped,
		};
	}

	return {
		value: snapped,
		min: Math.min( snapped, min ),
		max: Math.max( snapped, max ),
	};
}

function getInputCommitValue(
	nextValue: string,
	bounds: CropInputBounds,
	commitStep: number,
	clampToBounds = false
): number | null {
	if ( nextValue.trim() === '' ) {
		return null;
	}

	const parsed = Number( nextValue );
	if ( ! Number.isFinite( parsed ) ) {
		return null;
	}

	const snapped = snapInputValueToStep( parsed, commitStep );
	if ( snapped < bounds.min || snapped > bounds.max ) {
		if ( ! clampToBounds ) {
			return null;
		}
		return Math.min( bounds.max, Math.max( bounds.min, snapped ) );
	}

	return snapped;
}

function getWidthRange(
	rect: CropPixelRect,
	imageBounds: CropPixelRectBounds,
	aspectRatio: number | undefined,
	freeformCrop: boolean
): CropInputRange {
	if ( ! freeformCrop ) {
		return makeRange( rect.width, rect.width, false );
	}

	let minWidth = imageBounds.minWidth;
	let maxWidth = imageBounds.maxWidth;

	if ( aspectRatio && aspectRatio > 0 ) {
		minWidth = Math.max( minWidth, imageBounds.minHeight * aspectRatio );
		maxWidth = Math.min( maxWidth, imageBounds.maxHeight * aspectRatio );
	}

	return makeRange( minWidth, maxWidth );
}

function getHeightRange(
	rect: CropPixelRect,
	imageBounds: CropPixelRectBounds,
	aspectRatio: number | undefined,
	freeformCrop: boolean
): CropInputRange {
	if ( ! freeformCrop ) {
		return makeRange( rect.height, rect.height, false );
	}

	let minHeight = imageBounds.minHeight;
	let maxHeight = imageBounds.maxHeight;

	if ( aspectRatio && aspectRatio > 0 ) {
		minHeight = Math.max( minHeight, imageBounds.minWidth / aspectRatio );
		maxHeight = Math.min( maxHeight, imageBounds.maxWidth / aspectRatio );
	}

	return makeRange( minHeight, maxHeight );
}

function getVisualRotationDirection( flip: {
	horizontal: boolean;
	vertical: boolean;
} ): 1 | -1 {
	return flip.horizontal !== flip.vertical ? -1 : 1;
}

function getFineRotationOffset(
	rotation: number,
	flip: { horizontal: boolean; vertical: boolean }
): number {
	const baseAngle = Math.round( rotation / 90 ) * 90;
	return ( rotation - baseAngle ) * getVisualRotationDirection( flip );
}

function clampFineRotationOffset( value: number ): number {
	const max = MAX_ROTATION_OFFSET - FINE_ROTATION_COMMIT_STEP;
	return Math.max(
		-max,
		Math.min(
			max,
			snapInputValueToStep( value, FINE_ROTATION_COMMIT_STEP )
		)
	);
}

// Shows the user's in-flight text while typing. Valid numeric drafts update
// the cropper immediately; blur/Enter ends the interaction, and Escape
// discards any applied draft.
function CropInput( {
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
}: CropInputProps ) {
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

export default function CropAdvancedPanel( {
	aspectRatio,
	freeformCrop,
	onPlacementControlInteraction,
}: CropAdvancedPanelProps ) {
	const { state, setCropRect, setRotation, settleCrop, commitHistory } =
		useCropper();
	const geometry = useCropGeometry();
	const gestureHandlers = useCropGestureHandlers( { commitOnKeyUp: false } );

	if ( ! geometry.isReady || ! state.image ) {
		return null;
	}

	const { rect, imageBounds } = geometry;
	const imageSize = {
		width: state.image.naturalWidth,
		height: state.image.naturalHeight,
	};

	const commitRect = ( candidate: CropPixelRectInput ) => {
		const { rect: clampedRect } = validateCropPixelRectAgainstBounds(
			candidate,
			imageBounds
		);
		setCropRect(
			cropPixelRectToNormalizedRect( clampedRect, state, imageSize )
		);
		onPlacementControlInteraction?.();
	};

	const handleApply =
		( field: 'left' | 'top' | 'width' | 'height' ) => ( value: number ) => {
			const candidate = {
				left: rect.left,
				top: rect.top,
				width: rect.width,
				height: rect.height,
			};

			if ( field === 'width' ) {
				candidate.width = value;
				if ( aspectRatio && aspectRatio > 0 ) {
					candidate.height = Math.max( 1, value / aspectRatio );
				}
			} else if ( field === 'height' ) {
				candidate.height = value;
				if ( aspectRatio && aspectRatio > 0 ) {
					candidate.width = Math.max( 1, value * aspectRatio );
				}
			} else {
				candidate[ field ] = value;
			}

			commitRect( candidate );
		};

	const leftRange = makeRange(
		imageBounds.minLeft,
		imageBounds.maxRight - rect.width
	);
	const topRange = makeRange(
		imageBounds.minTop,
		imageBounds.maxBottom - rect.height
	);
	const widthRange = getWidthRange(
		rect,
		imageBounds,
		aspectRatio,
		freeformCrop
	);
	const heightRange = getHeightRange(
		rect,
		imageBounds,
		aspectRatio,
		freeformCrop
	);
	const fineRotationOffset = getFineRotationOffset(
		state.rotation,
		state.flip
	);
	const fineRotationRange = makeRange(
		-MAX_ROTATION_OFFSET + FINE_ROTATION_COMMIT_STEP,
		MAX_ROTATION_OFFSET - FINE_ROTATION_COMMIT_STEP
	);
	const canMoveCropRect = freeformCrop;
	const handleCropCommitEnd = () => {
		settleCrop();
		onPlacementControlInteraction?.();
	};

	const handleFineRotationApply = ( value: number ) => {
		const clampedOffset = clampFineRotationOffset( value );
		const delta = clampedOffset - fineRotationOffset;
		if ( Math.abs( delta ) < INPUT_VALUE_EPSILON ) {
			return;
		}

		const baseAngle = Math.round( state.rotation / 90 ) * 90;
		setRotation(
			baseAngle + clampedOffset * getVisualRotationDirection( state.flip )
		);
		onPlacementControlInteraction?.();
	};

	return (
		<PanelBody
			title={ __( 'Advanced' ) }
			initialOpen={ false }
			className="media-editor-crop-advanced-panel"
		>
			<Stack
				direction="column"
				gap="sm"
				role="presentation"
				{ ...gestureHandlers }
			>
				<Flex gap={ 2 } align="flex-start">
					<FlexItem isBlock>
						<CropInput
							label={ __( 'Fine rotation' ) }
							aria-label={ __( 'Fine rotation angle' ) }
							value={ fineRotationOffset }
							range={ fineRotationRange }
							step={ FINE_ROTATION_COMMIT_STEP }
							commitStep={ FINE_ROTATION_COMMIT_STEP }
							suffix={ DEGREE_SUFFIX }
							onCommit={ handleFineRotationApply }
							onCommitEnd={ commitHistory }
						/>
					</FlexItem>
				</Flex>
				<Flex gap={ 2 } align="flex-start">
					<FlexItem isBlock>
						<CropInput
							label={ __( 'X' ) }
							aria-label={ __( 'Crop horizontal position' ) }
							value={ rect.left }
							range={ leftRange }
							disabled={
								! canMoveCropRect || ! leftRange.isEditable
							}
							onCommit={ handleApply( 'left' ) }
							onCommitEnd={ handleCropCommitEnd }
						/>
					</FlexItem>
					<FlexItem isBlock>
						<CropInput
							label={ __( 'Y' ) }
							aria-label={ __( 'Crop vertical position' ) }
							value={ rect.top }
							range={ topRange }
							disabled={
								! canMoveCropRect || ! topRange.isEditable
							}
							onCommit={ handleApply( 'top' ) }
							onCommitEnd={ handleCropCommitEnd }
						/>
					</FlexItem>
				</Flex>
				<Flex gap={ 2 } align="flex-start">
					<FlexItem isBlock>
						<CropInput
							label={ __( 'Width' ) }
							value={ rect.width }
							range={ widthRange }
							disabled={ ! widthRange.isEditable }
							onCommit={ handleApply( 'width' ) }
							onCommitEnd={ handleCropCommitEnd }
						/>
					</FlexItem>
					<FlexItem isBlock>
						<CropInput
							label={ __( 'Height' ) }
							value={ rect.height }
							range={ heightRange }
							disabled={ ! heightRange.isEditable }
							onCommit={ handleApply( 'height' ) }
							onCommitEnd={ handleCropCommitEnd }
						/>
					</FlexItem>
				</Flex>
			</Stack>
		</PanelBody>
	);
}
