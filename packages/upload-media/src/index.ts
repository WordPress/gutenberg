/**
 * Internal dependencies
 */
import { store as uploadStore } from './store';

export { uploadStore as store };

export { default as MediaUploadProvider } from './components/provider';
export { UploadError } from './upload-error';

export type { ImageFormat } from './store/types';

// If the site is cross-origin isolated, add crossorigin="anonymous" to img, source,
// script, video, link and iframe elements. Add credentialless to iframes.
import './cross-origin-isolation';
