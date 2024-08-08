/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { ImageCropperContext } = unlock( componentsPrivateApis );

export const useImageCropper = () => useContext( ImageCropperContext );
