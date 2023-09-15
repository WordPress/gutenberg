/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

// Navigation
export const NAVIGATION_POST_TYPE = 'wp_navigation';

// Templates.
export const TEMPLATE_POST_TYPE = 'wp_template';
export const TEMPLATE_PART_POST_TYPE = 'wp_template_part';
export const TEMPLATE_CUSTOM_SOURCE = 'custom';

// Patterns.
export const PATTERN_POST_TYPE = 'wp_block';
export const PATTERN_DEFAULT_CATEGORY = 'all-patterns';
export const PATTERN_THEME_TYPE = 'pattern';
export const PATTERN_CORE_SOURCES = [
	'core',
	'pattern-directory/core',
	'pattern-directory/featured',
	'pattern-directory/theme',
];
export const PATTERN_SYNC_STATUSES = {
	full: 'fully',
	unsynced: 'unsynced',
};

// Entities that are editable in focus mode.
export const FOCUSABLE_ENTITIES = [
	TEMPLATE_PART_POST_TYPE,
	NAVIGATION_POST_TYPE,
	PATTERN_POST_TYPE,
];

export const POST_TYPE_LABELS = {
	[ TEMPLATE_POST_TYPE ]: __( 'Template' ),
	[ TEMPLATE_PART_POST_TYPE ]: __( 'Template Part' ),
	[ PATTERN_POST_TYPE ]: __( 'Pattern' ),
	[ NAVIGATION_POST_TYPE ]: __( 'Navigation' ),
};
