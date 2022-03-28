/**
 * Internal dependencies
 */
import { getCSSRules, generate } from '../index';

describe( 'generate', () => {
	it( 'should generate empty style', () => {
		expect( generate( {}, '.some-selector' ) ).toEqual( '' );
	} );

	it( 'should generate spacing styles', () => {
		expect(
			generate(
				{
					spacing: { padding: '10px', margin: '12px' },
				},
				{
					selector: '.some-selector',
				}
			)
		).toEqual( '.some-selector { margin: 12px; padding: 10px; }' );

		expect(
			generate(
				{
					spacing: {
						padding: { top: '10px', bottom: '5px' },
						margin: {
							top: '11px',
							right: '12px',
							bottom: '13px',
							left: '14px',
						},
					},
				},
				{
					selector: '.some-selector',
				}
			)
		).toEqual(
			'.some-selector { margin-top: 11px; margin-right: 12px; margin-bottom: 13px; margin-left: 14px; padding-top: 10px; padding-bottom: 5px; }'
		);
	} );
} );

describe( 'getCSSRules', () => {
	it( 'should return an empty rules array', () => {
		expect( getCSSRules( {}, '.some-selector' ) ).toEqual( [] );
	} );

	it( 'should ignore unsupported styles', () => {
		expect(
			getCSSRules(
				{
					typography: {
						fontVariantLigatures: 'no-common-ligatures',
					},
					spacing: { padding: '10px' },
				},
				{
					selector: '.some-selector',
				}
			)
		).toEqual( [
			{
				selector: '.some-selector',
				key: 'padding',
				value: '10px',
			},
		] );
	} );

	it( 'should return a rules array with CSS keys formatted in camelCase', () => {
		expect(
			getCSSRules(
				{
					spacing: { padding: '10px', margin: '12px' },
				},
				{
					selector: '.some-selector',
				}
			)
		).toEqual( [
			{
				selector: '.some-selector',
				key: 'margin',
				value: '12px',
			},
			{
				selector: '.some-selector',
				key: 'padding',
				value: '10px',
			},
		] );

		expect(
			getCSSRules(
				{
					spacing: {
						padding: { top: '10px', bottom: '5px' },
						margin: { right: '2em', left: '1vw' },
					},
				},
				{
					selector: '.some-selector',
				}
			)
		).toEqual( [
			{
				selector: '.some-selector',
				key: 'marginRight',
				value: '2em',
			},
			{
				selector: '.some-selector',
				key: 'marginLeft',
				value: '1vw',
			},
			{
				selector: '.some-selector',
				key: 'paddingTop',
				value: '10px',
			},
			{
				selector: '.some-selector',
				key: 'paddingBottom',
				value: '5px',
			},
		] );
	} );
} );
