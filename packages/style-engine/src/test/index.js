/**
 * Internal dependencies
 */
import { getCSSRules, generate } from '../index';

describe( 'generate', () => {
	it( 'should generate empty style', () => {
		expect( generate( {}, '.some-selector' ) ).toEqual( '' );
	} );

	it( 'should generate padding styles', () => {
		expect(
			generate(
				{
					spacing: { padding: '10px' },
				},
				'.some-selector'
			)
		).toEqual( '.some-selector { padding: 10px; }' );

		expect(
			generate(
				{
					spacing: { padding: { top: '10px', bottom: '5px' } },
				},
				'.some-selector'
			)
		).toEqual(
			'.some-selector { padding-top: 10px; padding-bottom: 5px; }'
		);
	} );
} );

describe( 'getCSSRules', () => {
	it( 'should return an empty rules array', () => {
		expect( getCSSRules( {}, '.some-selector' ) ).toEqual( [] );
	} );

	it( 'should return a rules array with CSS keys formatted in camelCase', () => {
		expect(
			getCSSRules(
				{
					spacing: { padding: '10px' },
				},
				'.some-selector'
			)
		).toEqual( [
			{
				selector: '.some-selector',
				key: 'padding',
				value: '10px',
			},
		] );

		expect(
			getCSSRules(
				{
					spacing: { padding: { top: '10px', bottom: '5px' } },
				},
				'.some-selector'
			)
		).toEqual( [
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
