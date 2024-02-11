/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const PATTERN_TYPES = {
	theme: 'pattern',
	user: 'wp_block',
};

export const PATTERN_DEFAULT_CATEGORY = 'all-patterns';
export const PATTERN_USER_CATEGORY = 'my-patterns';
export const EXCLUDED_PATTERN_SOURCES = [
	'core',
	'pattern-directory/core',
	'pattern-directory/featured',
];
export const PATTERN_SYNC_TYPES = {
	full: 'fully',
	unsynced: 'unsynced',
};

// TODO: This should not be hardcoded. Maybe there should be a config and/or an UI.
export const PARTIAL_SYNCING_SUPPORTED_BLOCKS = {
	'core/paragraph': { content: __( 'Content' ) },
	'core/heading': { content: __( 'Content' ) },
	'core/button': {
		text: __( 'Text' ),
		url: __( 'URL' ),
		linkTarget: __( 'Link Target' ),
		rel: __( 'Link Relationship' ),
	},
	'core/image': {
		url: __( 'URL' ),
		title: __( 'Title' ),
		alt: __( 'Alt Text' ),
	},
};
