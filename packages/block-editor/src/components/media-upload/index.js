/**
 * WordPress dependencies
 */
import { withFilters } from '@wordpress/components';

/**
 * This is a placeholder for the media upload component necessary to make it possible to provide
 * an integration with the core blocks that handle media files. By default it renders nothing but
 * it provides a way to have it overridden with the `editor.MediaUpload` filter.
 *
 * @return {WPComponent} The component to be rendered.
 */
const MediaUpload = () => null;

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/media-upload/README.md
 */
export default withFilters( 'editor.MediaUpload' )( MediaUpload );
