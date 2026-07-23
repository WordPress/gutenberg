/**
 * Internal dependencies
 */
import { normalizeStyleStateAliases } from '../convert-legacy-block';

describe( 'normalizeStyleStateAliases', () => {
	it( 'normalizes legacy viewport style state keys', () => {
		expect(
			normalizeStyleStateAliases( {
				mobile: { color: { text: '#ff0000' } },
				tablet: { color: { text: '#00ff00' } },
			} )
		).toEqual( {
			'@mobile': { color: { text: '#ff0000' } },
			'@tablet': { color: { text: '#00ff00' } },
		} );
	} );

	it( 'prefers canonical viewport style state keys', () => {
		expect(
			normalizeStyleStateAliases( {
				'@mobile': { color: { text: '#00ff00' } },
				mobile: { color: { text: '#ff0000' } },
			} )
		).toEqual( {
			'@mobile': { color: { text: '#00ff00' } },
		} );
	} );

	it( 'returns the original style when no aliases are present', () => {
		const style = {
			'@mobile': { color: { text: '#ff0000' } },
		};

		expect( normalizeStyleStateAliases( style ) ).toBe( style );
	} );

	it( 'returns the original style outside the Gutenberg plugin', () => {
		const style = {
			mobile: { color: { text: '#ff0000' } },
		};
		/* eslint-disable @wordpress/wp-global-usage */
		const isGutenbergPlugin = globalThis.IS_GUTENBERG_PLUGIN;

		try {
			globalThis.IS_GUTENBERG_PLUGIN = false;

			expect( normalizeStyleStateAliases( style ) ).toBe( style );
		} finally {
			globalThis.IS_GUTENBERG_PLUGIN = isGutenbergPlugin;
		}
		/* eslint-enable @wordpress/wp-global-usage */
	} );
} );
