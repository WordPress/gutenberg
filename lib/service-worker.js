/* global addEventListener, fetch */

addEventListener( 'fetch', function ( event ) {
	event.respondWith( fetch( event.request ) );
} );
