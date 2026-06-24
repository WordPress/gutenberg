/**
 * Internal dependencies
 */
import { normalizeStyleStateAliases } from '../style-state-back-compat';
import type { GlobalStylesConfig } from '../types';

describe( 'normalizeStyleStateAliases', () => {
	it( 'normalizes legacy responsive style state keys', () => {
		const config = {
			styles: {
				mobile: {
					color: { text: 'blue' },
				},
				tablet: {
					color: { text: 'red' },
				},
			},
		} as unknown as GlobalStylesConfig;

		expect( normalizeStyleStateAliases( config ) ).toEqual( {
			styles: {
				'@mobile': {
					color: { text: 'blue' },
				},
				'@tablet': {
					color: { text: 'red' },
				},
			},
		} );
	} );

	it( 'prefers canonical responsive style state keys', () => {
		const config = {
			styles: {
				'@mobile': {
					color: { text: 'green' },
				},
				mobile: {
					color: { text: 'blue' },
				},
			},
		} as unknown as GlobalStylesConfig;

		expect( normalizeStyleStateAliases( config ) ).toEqual( {
			styles: {
				'@mobile': {
					color: { text: 'green' },
				},
			},
		} );
	} );

	it( 'normalizes legacy custom style state keys', () => {
		const config = {
			styles: {
				blocks: {
					'core/navigation-link': {
						'@current': {
							color: { text: 'blue' },
						},
					},
				},
			},
		} as unknown as GlobalStylesConfig;

		expect( normalizeStyleStateAliases( config ) ).toEqual( {
			styles: {
				blocks: {
					'core/navigation-link': {
						'-current': {
							color: { text: 'blue' },
						},
					},
				},
			},
		} );
	} );

	it( 'normalizes nested style nodes', () => {
		const config = {
			styles: {
				blocks: {
					'core/button': {
						variations: {
							outline: {
								mobile: {
									color: { text: 'blue' },
								},
							},
						},
						elements: {
							button: {
								tablet: {
									color: { text: 'red' },
								},
							},
						},
					},
				},
			},
		} as unknown as GlobalStylesConfig;

		expect( normalizeStyleStateAliases( config ) ).toEqual( {
			styles: {
				blocks: {
					'core/button': {
						variations: {
							outline: {
								'@mobile': {
									color: { text: 'blue' },
								},
							},
						},
						elements: {
							button: {
								'@tablet': {
									color: { text: 'red' },
								},
							},
						},
					},
				},
			},
		} );
	} );

	it( 'returns the original config when no aliases are present', () => {
		const config = {
			styles: {
				blocks: {
					'core/button': {
						'@mobile': {
							color: { text: 'blue' },
						},
					},
				},
			},
		} as unknown as GlobalStylesConfig;

		expect( normalizeStyleStateAliases( config ) ).toBe( config );
	} );

	it( 'returns the original config outside the Gutenberg plugin', () => {
		const config = {
			styles: {
				blocks: {
					'core/button': {
						mobile: {
							color: { text: 'blue' },
						},
					},
				},
			},
		} as unknown as GlobalStylesConfig;
		/* eslint-disable @wordpress/wp-global-usage */
		const testGlobalThis = globalThis as typeof globalThis & {
			IS_GUTENBERG_PLUGIN?: boolean;
		};
		const isGutenbergPlugin = testGlobalThis.IS_GUTENBERG_PLUGIN;

		try {
			testGlobalThis.IS_GUTENBERG_PLUGIN = false;

			expect( normalizeStyleStateAliases( config ) ).toBe( config );
		} finally {
			testGlobalThis.IS_GUTENBERG_PLUGIN = isGutenbergPlugin;
		}
		/* eslint-enable @wordpress/wp-global-usage */
	} );
} );
