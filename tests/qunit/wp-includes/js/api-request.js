/* global wp, JSON */
( function( QUnit ) {
	var originalRootUrl = window.wpApiSettings.root;

	var nonceHeader = { 'X-WP-Nonce': 'not_a_real_nonce' };

	QUnit.module( 'wp-api-request', {
		afterEach: function() {
			window.wpApiSettings.root = originalRootUrl;
		}
	} );

	QUnit.test( 'does not mutate original object', function( assert ) {
		var settingsOriginal = {
			url: 'aaaaa',
			path: 'wp/v2/posts',
			headers: {
				'Header-Name': 'value'
			},
			data: {
				orderby: 'something'
			}
		};

		var settings = wp.apiRequest.buildAjaxOptions( settingsOriginal );

		assert.notStrictEqual( settings, settingsOriginal );
		assert.notStrictEqual( settings.headers, settingsOriginal.headers );
		assert.strictEqual( settings.data, settingsOriginal.data );

		assert.deepEqual( settings, {
			url: 'http://localhost/wp-json/wp/v2/posts',
			headers: {
				'X-WP-Nonce': 'not_a_real_nonce',
				'Header-Name': 'value'
			},
			data: {
				orderby: 'something'
			}
		} );

		assert.deepEqual( settingsOriginal, {
			url: 'aaaaa',
			path: 'wp/v2/posts',
			headers: {
				'Header-Name': 'value'
			},
			data: {
				orderby: 'something'
			}
		} );
	} );

	QUnit.test( 'does not add nonce header if already present', function( assert ) {
		[ 'X-WP-Nonce', 'x-wp-nonce', 'X-WP-NONCE' ].forEach( function( headerName ) {
			var nonceHeader = {};
			nonceHeader[ headerName ] = 'still_not_a_real_nonce';

			var settingsOriginal = {
				url: 'aaaa',
				headers: JSON.parse( JSON.stringify( nonceHeader ) )
			};

			var settings = wp.apiRequest.buildAjaxOptions( settingsOriginal );

			assert.notStrictEqual( settings, settingsOriginal );
			assert.strictEqual( settings.headers, settingsOriginal.headers );

			assert.deepEqual( settings, {
				url: 'aaaa',
				headers: nonceHeader
			} );
		} );
	} );

	QUnit.test( 'does not add nonce header if ?_wpnonce=... present', function( assert ) {
		var settingsOriginal = {
			url: 'aaaa',
			data: {
				_wpnonce: 'definitely_not_a_real_nonce'
			}
		};

		var settings = wp.apiRequest.buildAjaxOptions( settingsOriginal );

		assert.notStrictEqual( settings, settingsOriginal );

		assert.deepEqual( settings, {
			url: 'aaaa',
			headers: {},
			data: {
				_wpnonce: 'definitely_not_a_real_nonce'
			}
		} );
	} );

	QUnit.test( 'accepts namespace and endpoint', function( assert ) {
		assert.deepEqual( wp.apiRequest.buildAjaxOptions( {
			namespace: 'wp/v2',
			endpoint: 'posts'
		} ), {
			url: 'http://localhost/wp-json/wp/v2/posts',
			headers: nonceHeader
		} );
	} );

	QUnit.test( 'accepts namespace and endpoint with slashes', function( assert ) {
		assert.deepEqual( wp.apiRequest.buildAjaxOptions( {
			namespace: '/wp/v2/',
			endpoint: '/posts'
		} ), {
			url: 'http://localhost/wp-json/wp/v2/posts',
			headers: nonceHeader
		} );
	} );

	QUnit.test( 'accepts namespace and empty endpoint', function( assert ) {
		assert.deepEqual( wp.apiRequest.buildAjaxOptions( {
			namespace: 'wp/v2',
			endpoint: ''
		} ), {
			url: 'http://localhost/wp-json/wp/v2',
			headers: nonceHeader
		} );
	} );

	QUnit.test( 'accepts empty namespace and empty endpoint', function( assert ) {
		assert.deepEqual( wp.apiRequest.buildAjaxOptions( {
			namespace: '',
			endpoint: ''
		} ), {
			url: 'http://localhost/wp-json/',
			headers: nonceHeader
		} );
	} );

	QUnit.test(
		'accepts namespace and endpoint with slashes (plain permalinks)',
		function( assert ) {
			window.wpApiSettings.root = 'http://localhost/index.php?rest_route=/';
			assert.deepEqual( wp.apiRequest.buildAjaxOptions( {
				namespace: '/wp/v2/',
				endpoint: '/posts'
			} ), {
				url: 'http://localhost/index.php?rest_route=/wp/v2/posts',
				headers: nonceHeader
			} );
		}
	);

	QUnit.test(
		'accepts empty namespace and empty endpoint (plain permalinks)',
		function( assert ) {
			window.wpApiSettings.root = 'http://localhost/index.php?rest_route=/';
			assert.deepEqual( wp.apiRequest.buildAjaxOptions( {
				namespace: '',
				endpoint: ''
			} ), {
				url: 'http://localhost/index.php?rest_route=/',
				headers: nonceHeader
			} );
		}
	);
} )( window.QUnit );
