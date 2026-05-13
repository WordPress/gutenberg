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
import { useCropGestureHandlers } from '../../hooks/use-crop-gesture-handlers';
import CropInput from './crop-input';
import { useAdvancedCropControls } from './use-advanced-crop-controls';

interface CropAdvancedPanelProps {
	aspectRatio?: number;
	freeformCrop: boolean;
	onPlacementControlInteraction?: () => void;
}

const DEGREE_SUFFIX = <InputControlSuffixWrapper>°</InputControlSuffixWrapper>;

export default function CropAdvancedPanel( {
	aspectRatio,
	freeformCrop,
	onPlacementControlInteraction,
}: CropAdvancedPanelProps ) {
	const controls = useAdvancedCropControls( {
		aspectRatio,
		freeformCrop,
		onPlacementControlInteraction,
	} );
	const gestureHandlers = useCropGestureHandlers( { commitOnKeyUp: false } );

	if ( ! controls.isReady ) {
		return null;
	}

	const {
		rect,
		ranges,
		fineRotation,
		onPreview,
		onEdit,
		onEditEnd,
		onSessionStart,
		onSessionEnd,
		canMoveCropRect,
	} = controls;

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
							value={ fineRotation.offset }
							range={ fineRotation.range }
							step={ fineRotation.step }
							commitStep={ fineRotation.step }
							suffix={ DEGREE_SUFFIX }
							onCommit={ fineRotation.onEdit }
							onCommitEnd={ fineRotation.onEditEnd }
							onSessionStart={ onSessionStart }
							onSessionEnd={ onSessionEnd }
						/>
					</FlexItem>
				</Flex>
				<Flex gap={ 2 } align="flex-start">
					<FlexItem isBlock>
						<CropInput
							label={ __( 'X' ) }
							aria-label={ __( 'Crop horizontal position' ) }
							value={ rect.left }
							range={ ranges.left }
							disabled={
								! canMoveCropRect || ! ranges.left.isEditable
							}
							commitOnChange={ false }
							onPreview={ ( value ) =>
								onPreview( 'left', value )
							}
							onCommit={ ( value ) => onEdit( 'left', value ) }
							onCommitEnd={ onEditEnd }
						/>
					</FlexItem>
					<FlexItem isBlock>
						<CropInput
							label={ __( 'Y' ) }
							aria-label={ __( 'Crop vertical position' ) }
							value={ rect.top }
							range={ ranges.top }
							disabled={
								! canMoveCropRect || ! ranges.top.isEditable
							}
							commitOnChange={ false }
							onPreview={ ( value ) => onPreview( 'top', value ) }
							onCommit={ ( value ) => onEdit( 'top', value ) }
							onCommitEnd={ onEditEnd }
						/>
					</FlexItem>
				</Flex>
				<Flex gap={ 2 } align="flex-start">
					<FlexItem isBlock>
						<CropInput
							label={ __( 'Width' ) }
							value={ rect.width }
							range={ ranges.width }
							disabled={ ! ranges.width.isEditable }
							commitOnChange={ false }
							onPreview={ ( value ) =>
								onPreview( 'width', value )
							}
							onCommit={ ( value ) => onEdit( 'width', value ) }
							onCommitEnd={ onEditEnd }
						/>
					</FlexItem>
					<FlexItem isBlock>
						<CropInput
							label={ __( 'Height' ) }
							value={ rect.height }
							range={ ranges.height }
							disabled={ ! ranges.height.isEditable }
							commitOnChange={ false }
							onPreview={ ( value ) =>
								onPreview( 'height', value )
							}
							onCommit={ ( value ) => onEdit( 'height', value ) }
							onCommitEnd={ onEditEnd }
						/>
					</FlexItem>
				</Flex>
			</Stack>
		</PanelBody>
	);
}
