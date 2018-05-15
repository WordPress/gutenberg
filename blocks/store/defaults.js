/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const DEFAULT_CATEGORIES = get( window, [ 'customGutenberg', 'categories' ] ) || [
	{ slug: 'common', title: __( 'Common Blocks' ) },
	{ slug: 'formatting', title: __( 'Formatting' ) },
	{ slug: 'layout', title: __( 'Layout Elements' ) },
	{ slug: 'widgets', title: __( 'Widgets' ) },
	{ slug: 'embed', title: __( 'Embeds' ) },
	{ slug: 'shared', title: __( 'Shared Blocks' ) },
];
