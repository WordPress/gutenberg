/**
 * WordPress dependencies
 */
import {
	__experimentalInputControlSuffixWrapper as InputControlSuffixWrapper,
	Flex,
	FlexItem,
	PanelBody,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useCropper } from '../../image-editor';
import {
	cropPixelRectToNormalizedRect,
	validateCropPixelRectAgainstBounds,
	type CropPixelRectInput,
} from '../../image-editor/core/crop-geometry';
import { useCropGeometry } from '../../image-editor/react/hooks/use-crop-geometry';
import { useCropGestureHandlers } from '../../hooks/use-crop-gesture-handlers';
import CropInput from './crop-input';
import { makeRange } from './crop-input-utils';
import {
	FINE_ROTATION_COMMIT_STEP,
	clampFineRotationOffset,
	getFineRotationOffset,
	getFineRotationRange,
	getHeightRange,
	getVisualRotationDirection,
	getWidthRange,
	hasFineRotationChanged,
} from './crop-advanced-panel-utils';

interface CropAdvancedPanelProps {
	aspectRatio?: number;
	freeformCrop: boolean;
	onPlacementControlInteraction?: () => void;
}

const DEGREE_SUFFIX = (
	<InputControlSuffixWrapper>{ '\u00b0' }</InputControlSuffixWrapper>
);

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
	const fineRotationRange = getFineRotationRange();
	const canMoveCropRect = freeformCrop;
	const handleCropCommitEnd = () => {
		settleCrop();
		onPlacementControlInteraction?.();
	};

	const handleFineRotationApply = ( value: number ) => {
		const clampedOffset = clampFineRotationOffset( value );
		if ( ! hasFineRotationChanged( clampedOffset, fineRotationOffset ) ) {
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
