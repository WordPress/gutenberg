/* global self */

// https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting
self.addEventListener( 'install', function ( event ) {
	event.waitUntil( self.skipWaiting() );
} );

// https://developer.mozilla.org/en-US/docs/Web/API/Clients/claim
self.addEventListener( 'activate', function ( event ) {
	event.waitUntil( self.clients.claim() );
} );

// Necessary for Chrome to show the install button.
self.addEventListener( 'fetch', function () {} );
