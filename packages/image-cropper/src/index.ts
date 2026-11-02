// Deprecated: the `react-easy-crop` based cropper. Everything it needs lives
// in `./legacy`, so removing that folder and these exports removes it.
export { default as ImageCropper } from './legacy/components/image-cropper';
export {
	useImageCropper,
	default as ImageCropperProvider,
} from './legacy/provider';
export type * from './legacy/types';
export { normalizeRotation } from './legacy/utils';
