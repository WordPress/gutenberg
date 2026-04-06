'use strict';

const {
	wordpressDockerFileContents,
	getLoopbackPortConfig,
} = require( '../runtime/docker/docker-config' );

const baseConfig = ( port, testsPort = port + 1 ) => ( {
	xdebug: 'off',
	spx: 'off',
	env: {
		development: { port, phpVersion: null },
		tests: { port: testsPort, phpVersion: null },
	},
} );

describe( 'getLoopbackPortConfig', () => {
	it( 'returns Apache Listen + VirtualHost edits for a non-default port', () => {
		const out = getLoopbackPortConfig( 8888 );
		expect( out ).toContain( 'Listen 8888' );
		expect( out ).toContain( '/etc/apache2/ports.conf' );
		expect( out ).toContain( '<VirtualHost *:80 *:8888>' );
		expect( out ).toContain(
			'/etc/apache2/sites-enabled/000-default.conf'
		);
	} );

	it( 'uses an anchored sed pattern (no greedy 80 replacement)', () => {
		const out = getLoopbackPortConfig( 8888 );
		// Must NOT be a global s/80/.../g
		expect( out ).not.toMatch( /s\|80\|/ );
		expect( out ).toMatch( /s\|<VirtualHost \\\*:80>\|/ );
	} );

	it( 'returns an empty string for port 80 (no-op)', () => {
		expect( getLoopbackPortConfig( 80 ) ).toBe( '' );
	} );

	it( 'returns an empty string for port 443 (no-op, no SSL)', () => {
		expect( getLoopbackPortConfig( 443 ) ).toBe( '' );
	} );
} );

describe( 'wordpressDockerFileContents', () => {
	it( 'injects the loopback port fix for development on a non-default port', () => {
		const dockerfile = wordpressDockerFileContents(
			'development',
			baseConfig( 8888 )
		);
		expect( dockerfile ).toContain( 'Listen 8888' );
		expect( dockerfile ).toContain( '<VirtualHost *:80 *:8888>' );
	} );

	it( 'injects the per-env port for the tests environment', () => {
		const dockerfile = wordpressDockerFileContents(
			'tests',
			baseConfig( 8888, 8889 )
		);
		expect( dockerfile ).toContain( 'Listen 8889' );
		expect( dockerfile ).not.toContain( 'Listen 8888' );
	} );

	it( 'does not inject anything when the port is 80', () => {
		const dockerfile = wordpressDockerFileContents(
			'development',
			baseConfig( 80, 8889 )
		);
		expect( dockerfile ).not.toContain( 'Listen 80' );
		expect( dockerfile ).not.toContain( 'ports.conf' );
		expect( dockerfile ).not.toContain( '000-default.conf' );
	} );

	it( 'still emits the base FROM line and dependency steps', () => {
		const dockerfile = wordpressDockerFileContents(
			'development',
			baseConfig( 8888 )
		);
		expect( dockerfile ).toMatch( /^FROM wordpress/ );
		expect( dockerfile ).toContain( 'apt-get -qy update' );
	} );
} );
