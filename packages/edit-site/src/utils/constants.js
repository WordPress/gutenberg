/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { privateApis as patternPrivateApis } from '@wordpress/patterns';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

// Navigation
export const NAVIGATION_POST_TYPE = 'wp_navigation';

// Templates.
export const TEMPLATE_POST_TYPE = 'wp_template';
export const TEMPLATE_PART_POST_TYPE = 'wp_template_part';
export const TEMPLATE_ORIGINS = {
	custom: 'custom',
	theme: 'theme',
	plugin: 'plugin',
};
export const TEMPLATE_PART_AREA_DEFAULT_CATEGORY = 'uncategorized';

// Patterns.
export const {
	PATTERN_TYPES,
	PATTERN_DEFAULT_CATEGORY,
	PATTERN_USER_CATEGORY,
	PATTERN_CORE_SOURCES,
	PATTERN_SYNC_TYPES,
} = unlock( patternPrivateApis );

// Entities that are editable in focus mode.
export const FOCUSABLE_ENTITIES = [
	TEMPLATE_PART_POST_TYPE,
	NAVIGATION_POST_TYPE,
	PATTERN_TYPES.user,
];

/**
 * Block types that are considered to be page content. These are the only blocks
 * editable when hasPageContentFocus() is true.
 */
export const PAGE_CONTENT_BLOCK_TYPES = {
	'core/post-title': true,
	'core/post-featured-image': true,
	'core/post-content': true,
};

export const POST_TYPE_LABELS = {
	[ TEMPLATE_POST_TYPE ]: __( 'Template' ),
	[ TEMPLATE_PART_POST_TYPE ]: __( 'Template part' ),
	[ PATTERN_TYPES.user ]: __( 'Pattern' ),
	[ NAVIGATION_POST_TYPE ]: __( 'Navigation' ),
};
