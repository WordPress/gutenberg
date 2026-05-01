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
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import {
	cropPixelRectToNormalizedRect,
	useCropGeometry,
	useCropper,
	validateCropPixelRect,
	type CropPixelBounds,
	type CropPixelRect,
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

interface CropInputProps {
	label: string;
	'aria-label'?: string;
	value: number;
	range: CropInputRange;
	disabled?: boolean;
	onCommit: ( value: number ) => void;
}

const EPSILON = 1e-9;
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
		canApply: canApply && max - minValue > EPSILON,
	};
}

function getInputBounds( value: number, range: CropInputRange ) {
	const rounded = Math.round( value );
	return {
		value: rounded,
		min: Math.min( rounded, Math.floor( range.minValue ) ),
		max: Math.max( rounded, Math.ceil( range.maxValue ) ),
	};
}

function getWidthRange(
	rect: CropPixelRect,
	bounds: CropPixelBounds,
	aspectRatio: number | undefined,
	freeformCrop: boolean
): CropInputRange {
	if ( ! freeformCrop ) {
		return makeRange( rect.width, rect.width, false );
	}

	let minWidth = bounds.minWidth;
	let maxWidth = bounds.maxRight - rect.left;

	if ( aspectRatio && aspectRatio > 0 ) {
		minWidth = Math.max( minWidth, bounds.minHeight * aspectRatio );
		maxWidth = Math.min(
			maxWidth,
			( bounds.maxBottom - rect.top ) * aspectRatio
		);
	}

	return makeRange( minWidth, maxWidth );
}

function getHeightRange(
	rect: CropPixelRect,
	bounds: CropPixelBounds,
	aspectRatio: number | undefined,
	freeformCrop: boolean
): CropInputRange {
	if ( ! freeformCrop ) {
		return makeRange( rect.height, rect.height, false );
	}

	let minHeight = bounds.minHeight;
	let maxHeight = bounds.maxBottom - rect.top;

	if ( aspectRatio && aspectRatio > 0 ) {
		minHeight = Math.max( minHeight, bounds.minWidth / aspectRatio );
		maxHeight = Math.min(
			maxHeight,
			( bounds.maxRight - rect.left ) / aspectRatio
		);
	}

	return makeRange( minHeight, maxHeight );
}

// Shows a live draft while the user types, then snaps to the committed
// cropper value when the field blurs or Enter is pressed.
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
	const bounds = getInputBounds( value, range );

	const commitValue = ( nextValue: string ) => {
		if ( nextValue.trim() === '' ) {
			return;
		}
		const parsed = Number( nextValue );
		if ( ! Number.isFinite( parsed ) ) {
			return;
		}
		onCommit( parsed );
	};

	const handleFocus = () => {
		setFocused( true );
		setDraft( String( bounds.value ) );
	};

	const handleChange = ( nextValue: string | undefined ) => {
		const valueToCommit = nextValue ?? '';
		setDraft( valueToCommit );
		commitValue( valueToCommit );
	};

	const handleBlur = () => {
		setFocused( false );
		commitValue( draft );
	};

	const handleKeyDown = (
		event: React.KeyboardEvent< HTMLInputElement >
	) => {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
			setFocused( false );
			commitValue( draft );
			event.currentTarget.blur();
		} else if ( event.key === 'Escape' ) {
			event.preventDefault();
			setFocused( false );
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
	const { state, setCropRect } = useCropper();
	const { isReady, rect, bounds } = useCropGeometry();

	if ( ! isReady || ! rect || ! bounds || ! state.image ) {
		return null;
	}

	const imageSize = {
		width: state.image.naturalWidth,
		height: state.image.naturalHeight,
	};

	const commitRect = (
		candidate: Pick< CropPixelRect, 'left' | 'top' | 'width' | 'height' >
	) => {
		const { rect: clampedRect } = validateCropPixelRect(
			candidate,
			bounds
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

	const leftRange = makeRange( bounds.minLeft, bounds.maxRight - rect.width );
	const topRange = makeRange( bounds.minTop, bounds.maxBottom - rect.height );
	const widthRange = getWidthRange( rect, bounds, aspectRatio, freeformCrop );
	const heightRange = getHeightRange(
		rect,
		bounds,
		aspectRatio,
		freeformCrop
	);

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
							disabled={ ! leftRange.canApply }
							onCommit={ handleApply( 'left' ) }
						/>
					</FlexItem>
					<FlexItem isBlock>
						<CropInput
							label={ __( 'Top' ) }
							aria-label={ __( 'Crop top position' ) }
							value={ rect.top }
							range={ topRange }
							disabled={ ! topRange.canApply }
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
