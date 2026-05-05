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
import {
	cropPixelRectToNormalizedRect,
	useCropGeometry,
	useCropper,
	validateCropPixelRectAgainstBounds,
	type CropPixelRectBounds,
	type CropPixelRect,
	type CropPixelRectInput,
} from '../../image-editor';

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
	onCommit: ( value: number ) => void;
}

const INPUT_PREVIEW_DEBOUNCE_MS = 250;
const pxSuffix = <InputControlSuffixWrapper>px</InputControlSuffixWrapper>;

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
	range: CropInputRange
): CropInputBounds {
	const rounded = Math.round( value );
	const min = Math.ceil( range.minValue );
	const max = Math.floor( range.maxValue );

	if ( max < min ) {
		return {
			value: rounded,
			min: rounded,
			max: rounded,
		};
	}

	return {
		value: rounded,
		min: Math.min( rounded, min ),
		max: Math.max( rounded, max ),
	};
}

function getInputCommitValue(
	nextValue: string,
	bounds: CropInputBounds
): number | null {
	if ( nextValue.trim() === '' ) {
		return null;
	}

	const parsed = Number( nextValue );
	if ( ! Number.isFinite( parsed ) ) {
		return null;
	}

	const rounded = Math.round( parsed );
	return Math.max( bounds.min, Math.min( rounded, bounds.max ) );
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
	let maxWidth = imageBounds.maxRight - rect.left;

	if ( aspectRatio && aspectRatio > 0 ) {
		minWidth = Math.max( minWidth, imageBounds.minHeight * aspectRatio );
		maxWidth = Math.min(
			maxWidth,
			( imageBounds.maxBottom - rect.top ) * aspectRatio
		);
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
	let maxHeight = imageBounds.maxBottom - rect.top;

	if ( aspectRatio && aspectRatio > 0 ) {
		minHeight = Math.max( minHeight, imageBounds.minWidth / aspectRatio );
		maxHeight = Math.min(
			maxHeight,
			( imageBounds.maxRight - rect.left ) / aspectRatio
		);
	}

	return makeRange( minHeight, maxHeight );
}

// Shows the user's in-flight text while typing. Valid numeric drafts preview
// after a short pause, flush on blur/Enter, and Escape discards the draft.
function CropInput( {
	label,
	'aria-label': ariaLabel,
	value,
	range,
	disabled = false,
	onCommit,
}: CropInputProps ) {
	const [ focused, setFocused ] = useState( false );
	const [ draft, setDraft ] = useState( '' );
	const skipBlurCommitRef = useRef( false );
	const previewDelayRef = useRef< ReturnType< typeof setTimeout > >();
	const initialValueRef = useRef( value );
	const previewedValueRef = useRef< number | null >( null );
	const bounds = getInputBounds( value, range );

	useEffect( () => {
		return () => {
			if ( previewDelayRef.current ) {
				clearTimeout( previewDelayRef.current );
			}
		};
	}, [] );

	const cancelPreview = () => {
		if ( previewDelayRef.current ) {
			clearTimeout( previewDelayRef.current );
			previewDelayRef.current = undefined;
		}
	};

	const commitValue = ( nextValue: string ): boolean => {
		const commitValueCandidate = getInputCommitValue( nextValue, bounds );
		if ( commitValueCandidate === null ) {
			return false;
		}

		onCommit( commitValueCandidate );
		previewedValueRef.current = commitValueCandidate;
		return true;
	};

	const schedulePreview = ( nextValue: string ) => {
		cancelPreview();
		const previewValue = getInputCommitValue( nextValue, bounds );
		if ( previewValue === null ) {
			return;
		}

		previewDelayRef.current = setTimeout( () => {
			if ( previewedValueRef.current !== previewValue ) {
				onCommit( previewValue );
				previewedValueRef.current = previewValue;
			}
			previewDelayRef.current = undefined;
		}, INPUT_PREVIEW_DEBOUNCE_MS );
	};

	const handleFocus = () => {
		initialValueRef.current = bounds.value;
		previewedValueRef.current = null;
		setFocused( true );
		setDraft( String( bounds.value ) );
	};

	const handleChange = ( nextValue: string | undefined ) => {
		const nextDraft = nextValue ?? '';
		setDraft( nextDraft );
		schedulePreview( nextDraft );
	};

	const handleBlur = () => {
		setFocused( false );
		if ( skipBlurCommitRef.current ) {
			skipBlurCommitRef.current = false;
			return;
		}
		cancelPreview();
		commitValue( draft );
	};

	const handleKeyDown = (
		event: React.KeyboardEvent< HTMLInputElement >
	) => {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
			skipBlurCommitRef.current = true;
			setFocused( false );
			cancelPreview();
			commitValue( draft );
			event.currentTarget.blur();
		} else if ( event.key === 'Escape' ) {
			event.preventDefault();
			skipBlurCommitRef.current = true;
			setFocused( false );
			cancelPreview();
			if ( previewedValueRef.current !== null ) {
				onCommit( initialValueRef.current );
				previewedValueRef.current = null;
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
			step={ 1 }
			disabled={ disabled }
			onChange={ handleChange }
			onFocus={ handleFocus }
			onBlur={ handleBlur }
			onKeyDown={ handleKeyDown }
			suffix={ pxSuffix }
		/>
	);
}

export default function CropAdvancedPanel( {
	aspectRatio,
	freeformCrop,
	onPlacementControlInteraction,
}: CropAdvancedPanelProps ) {
	const { state, setCropRect, settleCrop } = useCropper();
	const { isReady, rect, bounds } = useCropGeometry();

	if ( ! isReady || ! rect || ! bounds || ! state.image ) {
		return null;
	}

	const imageBounds = bounds.image;
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
	const canMoveCropRect = freeformCrop;

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
							label={ __( 'Left' ) }
							aria-label={ __( 'Crop left position' ) }
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
							label={ __( 'Top' ) }
							aria-label={ __( 'Crop top position' ) }
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
