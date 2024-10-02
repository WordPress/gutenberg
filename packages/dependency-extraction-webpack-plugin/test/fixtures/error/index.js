/* eslint-disable @eslint-community/eslint-comments/disable-enable-pair */
/* eslint-disable @eslint-community/eslint-comments/no-unlimited-disable */
/* eslint-disable */

import $ from 'jquery';
const apiFetch = await import( '@wordpress/api-fetch' );

$( () => {
	apiFetch( { path: '/' } );
} );
