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

/**
 * ImageEditor component displays the image editor UI.
 *
 * @param {Object}   props                 Component props.
 * @param {string}   props.id              The id of the image being edited.
 * @param {string}   props.url             The url of the image being edited.
 * @param {number}   props.width           The width of the image being edited.
 * @param {number}   props.height          The height of the image being edited.
 * @param {number}   props.naturalHeight   The natural height of the image being edited.
 * @param {number}   props.naturalWidth    The natural width of the image being edited.
 * @param {Function} props.onSaveImage     Callback to save the image.
 * @param {Function} props.onFinishEditing Callback to finish editing the image.
 * @param {Object}   props.borderProps     Border properties.
 *
 * @return {Element} The ImageEditor component
 *
 * @example
 * ```jsx
 * function MyImageEditor() {
 * 	return (
 * 		<ImageEditor
 * 			id="image-id"
 * 			url="https://example.com/image.jpg"
 * 			width={ 300 }
 * 			height={ 200 }
 * 			naturalWidth={ 600 }
 * 			naturalHeight={ 400 }
 * 			onSaveImage={() => {}}
 * 			onFinishEditing={() => {}}
 * 			borderProps={{
 * 				style: {
 * 					backgroundColor: '#e0e0e0',
 *               },
 *              className: 'my-image-editor',
 * 			}}
 * 		/>
 * 	);
 * }
 */
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
