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
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useCropper } from '../../image-editor';
import { getCropPixels, pixelsToCropRect } from '../../utils/crop-pixels';

interface CropAdvancedPanelProps {
	onPlacementControlInteraction?: () => void;
}

const pxSuffix = <InputControlSuffixWrapper>px</InputControlSuffixWrapper>;

export default function CropAdvancedPanel( {
	onPlacementControlInteraction,
}: CropAdvancedPanelProps ) {
	const { state, setCropRect } = useCropper();

	const pixels = useMemo( () => {
		if ( ! state.image ) {
			return null;
		}
		const imageSize = {
			width: state.image.naturalWidth,
			height: state.image.naturalHeight,
		};
		const raw = getCropPixels( state, imageSize );
		return {
			x: Math.round( raw.x ),
			y: Math.round( raw.y ),
			width: Math.round( raw.width ),
			height: Math.round( raw.height ),
			snapW: Math.round( raw.snapBBoxWidth ),
			snapH: Math.round( raw.snapBBoxHeight ),
		};
	}, [ state ] );

	if ( ! pixels ) {
		return null;
	}

	const { x, y, width, height, snapW, snapH } = pixels;

	const handleChange =
		( field: 'x' | 'y' | 'width' | 'height' ) =>
		( nextValue: string | undefined ) => {
			const parsed = parseInt( nextValue ?? '', 10 );
			if ( isNaN( parsed ) || ! state.image ) {
				return;
			}

			const imageSize = {
				width: state.image.naturalWidth,
				height: state.image.naturalHeight,
			};

			const newRect = pixelsToCropRect(
				{
					x: field === 'x' ? parsed : x,
					y: field === 'y' ? parsed : y,
					width: field === 'width' ? parsed : width,
					height: field === 'height' ? parsed : height,
				},
				state,
				imageSize
			);

			setCropRect( newRect );
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
						<NumberControl
							__next40pxDefaultSize
							label={ __( 'Left' ) }
							aria-label={ __( 'Crop left position' ) }
							value={ x }
							min={ 0 }
							max={ Math.max( 0, snapW - width ) }
							step={ 1 }
							onChange={ handleChange( 'x' ) }
							suffix={ pxSuffix }
						/>
					</FlexItem>
					<FlexItem isBlock>
						<NumberControl
							__next40pxDefaultSize
							label={ __( 'Top' ) }
							aria-label={ __( 'Crop top position' ) }
							value={ y }
							min={ 0 }
							max={ Math.max( 0, snapH - height ) }
							step={ 1 }
							onChange={ handleChange( 'y' ) }
							suffix={ pxSuffix }
						/>
					</FlexItem>
				</Flex>
				<Flex gap={ 2 } align="flex-start">
					<FlexItem isBlock>
						<NumberControl
							__next40pxDefaultSize
							label={ __( 'Width' ) }
							value={ width }
							min={ 1 }
							max={ Math.max( 1, snapW - x ) }
							step={ 1 }
							onChange={ handleChange( 'width' ) }
							suffix={ pxSuffix }
						/>
					</FlexItem>
					<FlexItem isBlock>
						<NumberControl
							__next40pxDefaultSize
							label={ __( 'Height' ) }
							value={ height }
							min={ 1 }
							max={ Math.max( 1, snapH - y ) }
							step={ 1 }
							onChange={ handleChange( 'height' ) }
							suffix={ pxSuffix }
						/>
					</FlexItem>
				</Flex>
			</Stack>
		</PanelBody>
	);
}
