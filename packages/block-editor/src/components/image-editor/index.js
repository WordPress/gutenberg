/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarItem } from '@wordpress/components';
import deprecated from '@wordpress/deprecated';
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
 * @deprecated since 7.1. The Media Editor modal is now the default crop
 * experience for core blocks. This component (exported as
 * `__experimentalImageEditor`) will be removed in a future major release.
 *
 * @param {Object}   root0                 Component props.
 * @param {number}   root0.id              Media attachment ID.
 * @param {string}   root0.url             Media URL.
 * @param {number}   root0.width           Rendered image width.
 * @param {number}   root0.height          Rendered image height.
 * @param {number}   root0.naturalHeight   Natural image height.
 * @param {number}   root0.naturalWidth    Natural image width.
 * @param {Function} root0.onSaveImage     Callback to save image attributes.
 * @param {Function} root0.onFinishEditing Callback when editing finishes.
 * @param {Object}   root0.borderProps     Border classes and styles.
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
