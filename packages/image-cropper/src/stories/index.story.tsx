/**
 * Internal dependencies
 */
import ImageCropper from '../components/image-cropper';
import ImageCropperProvider from '../provider';
import type { ImageCropperProps } from '../types';

export default {
	title: 'ImageCropper/ImageCropper',
	component: ImageCropper,
};

const DefaultComponent = ( args: ImageCropperProps ) => {
	return (
		<div style={ { width: '100%', height: '500px' } }>
			<ImageCropperProvider>
				<ImageCropper { ...args } />
			</ImageCropperProvider>
		</div>
	);
};

export const Default = {
	render: DefaultComponent,
	args: {
		src: 'https://s.w.org/images/core/5.3/MtBlanc1.jpg',
	},
};
