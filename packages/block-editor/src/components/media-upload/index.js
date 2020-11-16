/**
 * WordPress dependencies
 */
import { withFilters } from '@wordpress/components';
import { createFilteredComponent } from '@wordpress/plugins';

const FILTER_NAME = 'editor.MediaUpload';

/**
 * This is a placeholder for the media upload component necessary to make it possible to provide
 * an integration with the core blocks that handle media files. By default it renders nothing but
 * it provides a way to have it overridden with the `editor.MediaUpload` filter.
 *
 * @return {WPComponent} The component to be rendered.
 */
const MediaUpload = () => null;

/**
 * Helper component for `MediaUpload` that enables extensibility through
 * Plugins API.
 *
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/plugins/README.md#FilteredComponent
 */
export const FilteredMediaUpload = createFilteredComponent( FILTER_NAME );

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/media-upload/README.md
 */
export default withFilters( FILTER_NAME )( MediaUpload );
