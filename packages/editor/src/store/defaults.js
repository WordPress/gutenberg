/**
 * WordPress dependencies
 */
import { SETTINGS_DEFAULTS } from '@wordpress/block-editor';

export const PREFERENCES_DEFAULTS = {
	insertUsage: {}, // Should be kept for backward compatibility, see: https://github.com/WordPress/gutenberg/issues/14580.
	isPublishSidebarEnabled: true,
};

/**
 * The default post editor settings
 *
 *  allowedBlockTypes  boolean|Array Allowed block types
 *  richEditingEnabled boolean       Whether rich editing is enabled or not
 *  codeEditingEnabled boolean       Whether code editing is enabled or not
 *  enableCustomFields boolean       Whether the WordPress custom fields are enabled or not
 *  autosaveInterval   number        Autosave Interval
 *  availableTemplates array?        The available post templates
 *  disablePostFormats boolean       Whether or not the post formats are disabled
 *  allowedMimeTypes   array?        List of allowed mime types and file extensions
 *  maxUploadFileSize  number        Maximum upload file size
 */
export const EDITOR_SETTINGS_DEFAULTS = {
	...SETTINGS_DEFAULTS,

	richEditingEnabled: true,
	codeEditingEnabled: true,
	enableCustomFields: false,
};

