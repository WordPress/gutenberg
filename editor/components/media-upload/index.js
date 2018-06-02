/**
 * WordPress dependencies
 */
import { withFilters } from '@wordpress/components';

/**
 * This is a placeholder for the media upload component necessary to make it possible to provide
 * an integration with the core blocks that handle media files. By default it renders nothing but
 * it provides a way to have it overridden with the `blocks.MediaUpload` filter.
 *
 * @return {WPElement} Media upload element.
 */
const MediaUpload = () => null;

// Todo: rename the filter
export default withFilters( 'blocks.MediaUpload' )( MediaUpload );
