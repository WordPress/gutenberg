import { ToolbarGroup, ToolbarItem } from '@wordpress/components';
import deprecated from '@wordpress/deprecated';
import { ImageCropperProvider } from '@wordpress/image-cropper';
import AspectRatioDropdown from './aspect-ratio-dropdown';
import BlockControls from '../block-controls';
import ImageEditingProvider from './context';
import Cropper from './cropper';
import ZoomDropdown from './zoom-dropdown';
import RotationButton from './rotation-button';
import FormControls from './form-controls';
import type { ImageEditorProps } from './types';

/**
 * @deprecated since 7.1. The Media Editor modal is now the default crop
 * experience for core blocks. This component (exported as
 * `__experimentalImageEditor`) will be removed in a future major release.
 *
 * @param      root0                 Component props.
 * @param      root0.id              Media attachment ID.
 * @param      root0.url             Media URL.
 * @param      root0.width           Rendered image width.
 * @param      root0.height          Rendered image height.
 * @param      root0.naturalHeight   Natural image height.
 * @param      root0.naturalWidth    Natural image width.
 * @param      root0.onSaveImage     Callback to save image attributes.
 * @param      root0.onFinishEditing Callback when editing finishes.
 * @param      root0.borderProps     Border classes and styles.
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
}: ImageEditorProps ) {
	deprecated( 'wp.blockEditor.__experimentalImageEditor', {
		since: '7.1',
		hint: 'The Media Editor modal is now the default crop experience for core blocks. This component will be removed in a future major release.',
	} );

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
