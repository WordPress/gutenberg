/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { desktop, tablet, mobile } from '@wordpress/icons';

/**
 * Set of post properties for which edits should assume a merging behavior,
 * assuming an object value.
 *
 * @type {Set}
 */
export const EDIT_MERGE_PROPERTIES = new Set( [ 'meta' ] );

/**
 * Constant for the store module (or reducer) key.
 */
export const STORE_NAME = 'core/editor';

export const PERMALINK_POSTNAME_REGEX = /%(?:postname|pagename)%/;
export const ONE_MINUTE_IN_MS = 60 * 1000;
export const AUTOSAVE_PROPERTIES = [ 'title', 'excerpt', 'content' ];
export const TEMPLATE_PART_AREA_DEFAULT_CATEGORY = 'uncategorized';
export const TEMPLATE_POST_TYPE = 'wp_template';
export const TEMPLATE_PART_POST_TYPE = 'wp_template_part';
export const PATTERN_POST_TYPE = 'wp_block';
export const NAVIGATION_POST_TYPE = 'wp_navigation';
export const ATTACHMENT_POST_TYPE = 'attachment';
export const TEMPLATE_ORIGINS = {
	custom: 'custom',
	theme: 'theme',
	plugin: 'plugin',
};
export const TEMPLATE_POST_TYPES = [ 'wp_template', 'wp_template_part' ];
export const GLOBAL_POST_TYPES = [
	...TEMPLATE_POST_TYPES,
	'wp_block',
	'wp_navigation',
];
export const DESIGN_POST_TYPES = [
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	PATTERN_POST_TYPE,
	NAVIGATION_POST_TYPE,
];

/*
 * Contains the device types and their corresponding canvas width.
 * Matches the breakpoints in packages/base-styles/_breakpoints.scss,
 * and breakpoints in packages/compose/src/hooks/use-viewport-match/index.js.
 * minus 1 to trigger the media query for device preview.
 *
 * These breakpoints are currently hardcoded, but are expected to become
 * customizable via the `settings.viewport` values in theme.json in the future.
 * See https://github.com/WordPress/gutenberg/pull/79104.
 */
export const DEVICE_TYPES: Record<
	string,
	{
		value: string;
		label: string;
		icon: React.JSX.Element;
		canvasWidth: number | undefined;
	}
> = {
	Desktop: {
		value: 'Desktop',
		label: __( 'Desktop' ),
		icon: desktop,
		canvasWidth: undefined,
	},
	Tablet: {
		value: 'Tablet',
		label: __( 'Tablet' ),
		icon: tablet,
		canvasWidth: 782 - 1, // preview for useViewportMatch( 'medium', '<' )
	},
	Mobile: {
		value: 'Mobile',
		label: __( 'Mobile' ),
		icon: mobile,
		canvasWidth: 480 - 1, // preview for useViewportMatch( 'mobile', '<' )
	},
};
