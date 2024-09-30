/**
 * Internal dependencies
 */
import phrasingContentReducer from '../phrasing-content-reducer';
import { deepFilterHTML } from '../utils';

describe( 'phrasingContentReducer', () => {
	it( 'should transform font weight', () => {
		expect(
			deepFilterHTML(
				'<span style="font-weight:bold">test</span>',
				[ phrasingContentReducer ],
				{}
			)
		).toEqual( '<strong><span>test</span></strong>' );
	} );

	it( 'should transform numeric font weight', () => {
		expect(
			deepFilterHTML(
				'<span style="font-weight:700">test</span>',
				[ phrasingContentReducer ],
				{}
			)
		).toEqual( '<strong><span>test</span></strong>' );
	} );

	it( 'should transform font style', () => {
		expect(
			deepFilterHTML(
				'<span style="font-style:italic">test</span>',
				[ phrasingContentReducer ],
				{}
			)
		).toEqual( '<em><span>test</span></em>' );
	} );

	it( 'should transform nested formatting', () => {
		expect(
			deepFilterHTML(
				'<span style="font-style:italic;font-weight:bold">test</span>',
				[ phrasingContentReducer ],
				{}
			)
		).toEqual( '<strong><em><span>test</span></em></strong>' );
	} );
} );
