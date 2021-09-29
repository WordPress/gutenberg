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
 *  enableCustomFields boolean       Whether the WordPress custom fields are enabled or not.
 *                                     true  = the user has opted to show the Custom Fields panel at the bottom of the editor.
 *                                     false = the user has opted to hide the Custom Fields panel at the bottom of the editor.
 *                                     undefined = the current environment does not support Custom Fields,
 *                                                 so the option toggle in Preferences -> Panels to
 *                                                 enable the Custom Fields panel is not displayed.
 *  autosaveInterval   number        Autosave Interval
 *  availableTemplates array?        The available post templates
 *  disablePostFormats boolean       Whether or not the post formats are disabled
 *  allowedMimeTypes   array?        List of allowed mime types and file extensions
 *  maxUploadFileSize  number        Maximum upload file size
 *  supportsLayout     boolean      Whether the editor supports layouts.
 */
export const EDITOR_SETTINGS_DEFAULTS = {
	...SETTINGS_DEFAULTS,

	richEditingEnabled: true,
	codeEditingEnabled: true,
	enableCustomFields: undefined,
	supportsLayout: true,
};
