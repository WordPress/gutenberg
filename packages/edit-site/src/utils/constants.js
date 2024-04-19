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
export const TEMPLATE_PART_ALL_AREAS_CATEGORY = 'all-parts';

// Patterns.
export const {
	PATTERN_TYPES,
	PATTERN_DEFAULT_CATEGORY,
	PATTERN_USER_CATEGORY,
	EXCLUDED_PATTERN_SOURCES,
	PATTERN_SYNC_TYPES,
} = unlock( patternPrivateApis );

// Entities that are editable in focus mode.
export const FOCUSABLE_ENTITIES = [
	TEMPLATE_PART_POST_TYPE,
	NAVIGATION_POST_TYPE,
	PATTERN_TYPES.user,
];

export const POST_TYPE_LABELS = {
	[ TEMPLATE_POST_TYPE ]: __( 'Template' ),
	[ TEMPLATE_PART_POST_TYPE ]: __( 'Template part' ),
	[ PATTERN_TYPES.user ]: __( 'Pattern' ),
	[ NAVIGATION_POST_TYPE ]: __( 'Navigation' ),
};

// DataViews constants
export const LAYOUT_GRID = 'grid';
export const LAYOUT_TABLE = 'table';
export const LAYOUT_LIST = 'list';
export const ENUMERATION_TYPE = 'enumeration';
export const OPERATOR_IS = 'is';
export const OPERATOR_IS_NOT = 'isNot';
export const OPERATOR_IS_ANY = 'isAny';
export const OPERATOR_IS_NONE = 'isNone';
