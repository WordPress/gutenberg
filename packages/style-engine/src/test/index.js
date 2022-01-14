/**
 * Internal dependencies
 */
import { generate } from '../index';

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
