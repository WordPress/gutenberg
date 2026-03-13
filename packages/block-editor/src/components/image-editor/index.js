/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarItem } from '@wordpress/components';
import { ImageCropperProvider } from '@wordpress/image-cropper';

/**
 * Internal dependencies
 */
import AspectRatioDropdown from './aspect-ratio-dropdown';
import BlockControls from '../block-controls';
import ImageEditingProvider from './context';
import Cropper from './cropper';
import ZoomDropdown from './zoom-dropdown';
import RotationButton from './rotation-button';
import FormControls from './form-controls';
import CropToContentButton from './crop-to-content-button';

export default function ImageEditor( {
	id,
	url,
	width,
	height,
	naturalHeight,
	naturalWidth,
	onSaveImage,
	onFinishEditing,
	borderProps,
	cropToContentBounds,
} ) {
	return (
		<ImageCropperProvider>
			<ImageEditingProvider
				id={ id }
				url={ url }
				naturalWidth={ naturalWidth }
				naturalHeight={ naturalHeight }
				onSaveImage={ onSaveImage }
				onFinishEditing={ onFinishEditing }
				cropToContentBounds={ cropToContentBounds }
			>
				<Cropper
					borderProps={ borderProps }
					url={ url }
					width={ width }
					height={ height }
					naturalHeight={ naturalHeight }
					naturalWidth={ naturalWidth }
				/>
				<BlockControls>
					<ToolbarGroup>
						<ZoomDropdown />
						<ToolbarItem>
							{ ( toggleProps ) => (
								<AspectRatioDropdown
									toggleProps={ toggleProps }
								/>
							) }
						</ToolbarItem>
						<CropToContentButton />
						<RotationButton />
					</ToolbarGroup>
					<ToolbarGroup>
						<FormControls />
					</ToolbarGroup>
				</BlockControls>
			</ImageEditingProvider>
		</ImageCropperProvider>
	);
}
