/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const rows = [
	{ cols: [ 6, 6 ], title: 'col6 x 2', description: __( '2 eq columns layout' ) },
	{ cols: [ 4, 4, 4 ], title: 'col4 x 3', description: __( '3 eq columns layout' ) },
];

/**
 * Returns all the available rows.
 *
 * @return {Array} rows.
 */
export function getRows() {
	const customRows = get( window, [ 'customGutenberg', 'rows' ] );
	return customRows || rows;
}
