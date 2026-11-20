import { describe, expect, it } from 'vitest';
import type { GlobalStylesConfig } from '@wordpress/global-styles-engine';
import { removeVariationCss } from '../utils';

const variations = [
	{
		title: 'Boxed',
		styles: {
			css: 'body { padding: 20px; }',
			blocks: { 'core/group': { css: '.a { margin: 0; }' } },
		},
	},
	{ title: 'Plain', styles: {} },
] as GlobalStylesConfig[];

describe( 'removeVariationCss', () => {
	it( 'returns an empty string when there is no CSS', () => {
		expect( removeVariationCss( undefined, variations ) ).toBe( '' );
	} );

	it( 'removes CSS copied from a theme variation', () => {
		expect(
			removeVariationCss( 'body { padding: 20px; } ', variations )
		).toBe( '' );
	} );

	it( 'keeps CSS written by the user', () => {
		expect(
			removeVariationCss(
				'body { padding: 20px; } p { color: red; }',
				variations
			)
		).toBe( 'p { color: red; }' );
	} );

	it( 'leaves CSS alone when no variation matches', () => {
		expect( removeVariationCss( 'p { color: red; }', variations ) ).toBe(
			'p { color: red; }'
		);
	} );

	it( 'removes block level variation CSS', () => {
		expect(
			removeVariationCss(
				'.a { margin: 0; } .b { top: 0; }',
				variations,
				'core/group'
			)
		).toBe( '.b { top: 0; }' );
	} );
} );
