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
import {
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import {
	cropPixelRectToNormalizedRect,
	useCropGeometry,
	useCropper,
	validateCropPixelRectAgainstBounds,
	type CropPixelRectBounds,
	type CropPixelRect,
	type CropPixelRectInput,
} from '../../image-editor';
import { MAX_ROTATION_OFFSET } from '../../image-editor/core/constants';

interface CropAdvancedPanelProps {
	aspectRatio?: number;
	freeformCrop: boolean;
	onPlacementControlInteraction?: () => void;
}

interface CropInputRange {
	minValue: number;
	maxValue: number;
	canApply: boolean;
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
	step?: number;
	commitStep?: number;
	suffix?: React.ReactNode;
	onCommit: ( value: number ) => void;
}

const INPUT_COMMIT_DEBOUNCE_MS = 250;
const INPUT_INTEGER_EPSILON = 1e-6;
const FINE_ROTATION_COMMIT_STEP = 0.5;
const pxSuffix = <InputControlSuffixWrapper>px</InputControlSuffixWrapper>;
const degreeSuffix = (
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

function snapInputBoundToStep( value: number, step: number ): number {
	const snapped = snapInputValueToStep( value, step );
	return Math.abs( value - snapped ) < INPUT_INTEGER_EPSILON
		? snapped
		: value;
}

function ceilInputValueToStep( value: number, step: number ): number {
	return snapInputValueToStep(
		Math.ceil( snapInputBoundToStep( value, step ) / step ) * step,
		step
	);
}

function floorInputValueToStep( value: number, step: number ): number {
	return snapInputValueToStep(
		Math.floor( snapInputBoundToStep( value, step ) / step ) * step,
		step
	);
}

function makeRange(
	minValue: number,
	maxValue: number,
	canApply = true
): CropInputRange {
	const max = Math.max( minValue, maxValue );
	return {
		minValue,
		maxValue: max,
		canApply: canApply && max > minValue,
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
	commitStep: number
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
		return null;
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

// Shows the user's in-flight text while typing. Valid numeric drafts commit
// after a short pause, flush on blur/Enter, and Escape discards the draft.
function CropInput( {
	label,
	'aria-label': ariaLabel,
	value,
	range,
	disabled = false,
	step = 1,
	commitStep = step,
	suffix = pxSuffix,
	onCommit,
}: CropInputProps ) {
	const [ focused, setFocused ] = useState( false );
	const [ draft, setDraft ] = useState( '' );
	const skipBlurCommitRef = useRef( false );
	const commitDelayRef = useRef< ReturnType< typeof setTimeout > >();
	const initialValueRef = useRef( value );
	const lastCommittedDraftValueRef = useRef< number | null >( null );
	const bounds = getInputBounds( value, range, commitStep );
	const boundsRef = useRef( bounds );
	const commitStepRef = useRef( commitStep );
	const onCommitRef = useRef( onCommit );

	useLayoutEffect( () => {
		boundsRef.current = bounds;
		commitStepRef.current = commitStep;
		onCommitRef.current = onCommit;
	}, [ bounds, commitStep, onCommit ] );

	useEffect( () => {
		return () => {
			if ( commitDelayRef.current ) {
				clearTimeout( commitDelayRef.current );
			}
		};
	}, [] );

	const cancelDelayedCommit = () => {
		if ( commitDelayRef.current ) {
			clearTimeout( commitDelayRef.current );
			commitDelayRef.current = undefined;
		}
	};

	const commitValue = ( nextValue: string ): boolean => {
		const commitValueCandidate = getInputCommitValue(
			nextValue,
			boundsRef.current,
			commitStepRef.current
		);
		if ( commitValueCandidate === null ) {
			return false;
		}

		if ( lastCommittedDraftValueRef.current !== commitValueCandidate ) {
			onCommitRef.current( commitValueCandidate );
		}
		lastCommittedDraftValueRef.current = commitValueCandidate;
		return true;
	};

	const scheduleDelayedCommit = ( nextValue: string ) => {
		cancelDelayedCommit();
		const delayedCommitValue = getInputCommitValue(
			nextValue,
			bounds,
			commitStep
		);
		if ( delayedCommitValue === null ) {
			return;
		}

		commitDelayRef.current = setTimeout( () => {
			const latestCommitValue = getInputCommitValue(
				nextValue,
				boundsRef.current,
				commitStepRef.current
			);
			if ( latestCommitValue === null ) {
				commitDelayRef.current = undefined;
				return;
			}

			if ( lastCommittedDraftValueRef.current !== latestCommitValue ) {
				onCommitRef.current( latestCommitValue );
				lastCommittedDraftValueRef.current = latestCommitValue;
			}
			commitDelayRef.current = undefined;
		}, INPUT_COMMIT_DEBOUNCE_MS );
	};

	const handleFocus = () => {
		initialValueRef.current = bounds.value;
		lastCommittedDraftValueRef.current = null;
		setFocused( true );
		setDraft( String( bounds.value ) );
	};

	const handleChange = ( nextValue: string | undefined ) => {
		const nextDraft = nextValue ?? '';
		setDraft( nextDraft );
		scheduleDelayedCommit( nextDraft );
	};

	const handleBlur = () => {
		setFocused( false );
		if ( skipBlurCommitRef.current ) {
			skipBlurCommitRef.current = false;
			return;
		}
		cancelDelayedCommit();
		commitValue( draft );
	};

	const handleKeyDown = (
		event: React.KeyboardEvent< HTMLInputElement >
	) => {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
			skipBlurCommitRef.current = true;
			setFocused( false );
			cancelDelayedCommit();
			commitValue( draft );
			event.currentTarget.blur();
		} else if ( event.key === 'Escape' ) {
			event.preventDefault();
			skipBlurCommitRef.current = true;
			setFocused( false );
			cancelDelayedCommit();
			if ( lastCommittedDraftValueRef.current !== null ) {
				onCommitRef.current( initialValueRef.current );
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
			min={ bounds.min }
			max={ bounds.max }
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
	const { state, applyOperation, settleCrop } = useCropper();
	const geometry = useCropGeometry();

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
		applyOperation( {
			type: 'crop',
			rect: cropPixelRectToNormalizedRect(
				clampedRect,
				state,
				imageSize
			),
		} );
		settleCrop();
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

	const handleFineRotationApply = ( value: number ) => {
		const clampedOffset = clampFineRotationOffset( value );
		const delta = clampedOffset - fineRotationOffset;
		if ( Math.abs( delta ) < INPUT_INTEGER_EPSILON ) {
			return;
		}

		applyOperation( {
			type: 'rotate',
			degrees: delta,
		} );
		onPlacementControlInteraction?.();
	};

	return (
		<PanelBody
			title={ __( 'Advanced' ) }
			initialOpen={ false }
			className="media-editor-crop-advanced-panel"
		>
			<Stack direction="column" gap="sm">
				<Flex gap={ 2 } align="flex-start">
					<FlexItem isBlock>
						<CropInput
							label={ __( 'Fine rotation' ) }
							aria-label={ __( 'Fine rotation angle' ) }
							value={ fineRotationOffset }
							range={ fineRotationRange }
							step={ FINE_ROTATION_COMMIT_STEP }
							commitStep={ FINE_ROTATION_COMMIT_STEP }
							suffix={ degreeSuffix }
							onCommit={ handleFineRotationApply }
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
								! canMoveCropRect || ! leftRange.canApply
							}
							onCommit={ handleApply( 'left' ) }
						/>
					</FlexItem>
					<FlexItem isBlock>
						<CropInput
							label={ __( 'Y' ) }
							aria-label={ __( 'Crop vertical position' ) }
							value={ rect.top }
							range={ topRange }
							disabled={
								! canMoveCropRect || ! topRange.canApply
							}
							onCommit={ handleApply( 'top' ) }
						/>
					</FlexItem>
				</Flex>
				<Flex gap={ 2 } align="flex-start">
					<FlexItem isBlock>
						<CropInput
							label={ __( 'Width' ) }
							value={ rect.width }
							range={ widthRange }
							disabled={ ! widthRange.canApply }
							onCommit={ handleApply( 'width' ) }
						/>
					</FlexItem>
					<FlexItem isBlock>
						<CropInput
							label={ __( 'Height' ) }
							value={ rect.height }
							range={ heightRange }
							disabled={ ! heightRange.canApply }
							onCommit={ handleApply( 'height' ) }
						/>
					</FlexItem>
				</Flex>
			</Stack>
		</PanelBody>
	);
}
