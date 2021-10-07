/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * The identifier for the data store.
 *
 * @type {string}
 */
export const STORE_NAME = 'core/edit-site';

export const TEMPLATE_PART_AREA_HEADER = 'header';
export const TEMPLATE_PART_AREA_FOOTER = 'footer';
export const TEMPLATE_PART_AREA_SIDEBAR = 'sidebar';

export const TEMPLATE_PART_AREA_TO_NAME = {
	[ TEMPLATE_PART_AREA_HEADER ]: __( 'Header' ),
	[ TEMPLATE_PART_AREA_FOOTER ]: __( 'Footer' ),
	[ TEMPLATE_PART_AREA_SIDEBAR ]: __( 'Sidebar' ),
};
