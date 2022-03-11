/**
 * WordPress dependencies
 */
import { SETTINGS_DEFAULTS } from '@wordpress/block-editor';

export const PREFERENCES_DEFAULTS = {
	insertUsage: {}, // Should be kept for backward compatibility, see: https://github.com/WordPress/gutenberg/issues/14580.
	isPublishSidebarEnabled: true,
};

/**
 * The default post editor settings.
 *
 * @property {boolean|Array} allowedBlockTypes     Allowed block types
 * @property {boolean}       richEditingEnabled    Whether rich editing is enabled or not
 * @property {boolean}       codeEditingEnabled    Whether code editing is enabled or not
 * @property {boolean}       enableCustomFields    Whether the WordPress custom fields are enabled or not.
 *                                                 true  = the user has opted to show the Custom Fields panel at the bottom of the editor.
 *                                                 false = the user has opted to hide the Custom Fields panel at the bottom of the editor.
 *                                                 undefined = the current environment does not support Custom Fields, so the option toggle in Preferences -> Panels to enable the Custom Fields panel is not displayed.
 * @property {number}        autosaveInterval      How often in seconds the post will be auto-saved via the REST API.
 * @property {number}        localAutosaveInterval How often in seconds the post will be backed up to sessionStorage.
 * @property {Array?}        availableTemplates    The available post templates
 * @property {boolean}       disablePostFormats    Whether or not the post formats are disabled
 * @property {Array?}        allowedMimeTypes      List of allowed mime types and file extensions
 * @property {number}        maxUploadFileSize     Maximum upload file size
 * @property {boolean}       supportsLayout        Whether the editor supports layouts.
 */
export const EDITOR_SETTINGS_DEFAULTS = {
	...SETTINGS_DEFAULTS,

	richEditingEnabled: true,
	codeEditingEnabled: true,
	enableCustomFields: undefined,
	supportsLayout: true,
};
