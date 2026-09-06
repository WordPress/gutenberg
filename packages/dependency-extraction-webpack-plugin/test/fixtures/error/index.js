import $ from 'jquery';

const apiFetch = await import( '@wordpress/api-fetch' );
$( () => {
	apiFetch( { path: '/' } );
} );
