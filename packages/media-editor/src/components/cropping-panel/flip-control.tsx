/**
 * WordPress dependencies
 */
import { Button, __experimentalHStack as HStack } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { flipHorizontal, flipVertical } from '@wordpress/icons';
import { useImageCropper } from '@wordpress/image-cropper';

/**
 * FlipControl component provides buttons to flip the image horizontally or vertically.
 * Uses regular buttons (not toggle) that flip the image each time they're clicked.
 */
export default function FlipControl() {
	const { cropperState, setCropperState } = useImageCropper();
	const flip = cropperState.flip;

	const handleFlipHorizontal = () => {
		setCropperState( {
			flip: {
				...flip,
				horizontal: ! flip.horizontal,
			},
		} );
	};

	const handleFlipVertical = () => {
		setCropperState( {
			flip: {
				...flip,
				vertical: ! flip.vertical,
			},
		} );
	};

	return (
		<HStack
			className="media-editor-flip-control"
			justify="space-between"
			spacing={ 2 }
		>
			<Button
				__next40pxDefaultSize
				variant="secondary"
				icon={ flipHorizontal }
				onClick={ handleFlipHorizontal }
				className="media-editor-flip-control__button"
			>
				{ __( 'Horizontal' ) }
			</Button>
			<Button
				__next40pxDefaultSize
				variant="secondary"
				icon={ flipVertical }
				onClick={ handleFlipVertical }
				className="media-editor-flip-control__button"
			>
				{ __( 'Vertical' ) }
			</Button>
		</HStack>
	);
}
