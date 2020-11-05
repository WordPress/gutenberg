/**
 * Internal dependencies
 */
import figureContentReducer from '../figure-content-reducer';
import { deepFilterHTML } from '../utils';

describe( 'figureContentReducer', () => {
	const schema = {
		figure: {
			children: {
				img: {},
				a: {
					children: {
						img: {},
					},
				},
			},
		},
	};

	it( 'should wrap image in figure', () => {
		const input = '<img>';
		const output = '<figure><img></figure>';

		expect(
			deepFilterHTML( input, [ figureContentReducer ], schema )
		).toEqual( output );
	} );

	it( 'should move lone embedded content from paragraph', () => {
		const input = '<p><img></p>';
		const output = '<figure><img></figure><p></p>';

		expect(
			deepFilterHTML( input, [ figureContentReducer ], schema )
		).toEqual( output );
	} );

	it( 'should move multiple lone embedded content from paragraph', () => {
		const input = '<p><img><img></p>';
		const output = '<figure><img></figure><figure><img></figure><p></p>';

		expect(
			deepFilterHTML( input, [ figureContentReducer ], schema )
		).toEqual( output );
	} );

	it( 'should move aligned embedded content from paragraph (1)', () => {
		const input = '<p><img class="alignright">test</p>';
		const output = '<figure><img class="alignright"></figure><p>test</p>';

		expect(
			deepFilterHTML( input, [ figureContentReducer ], schema )
		).toEqual( output );
	} );

	it( 'should move aligned embedded content from paragraph (2)', () => {
		const input = '<p>test<img class="alignright"></p>';
		const output = '<figure><img class="alignright"></figure><p>test</p>';

		expect(
			deepFilterHTML( input, [ figureContentReducer ], schema )
		).toEqual( output );
	} );

	it( 'should move aligned embedded content from paragraph (3)', () => {
		const input = '<p>test<img class="alignright">test</p>';
		const output =
			'<figure><img class="alignright"></figure><p>testtest</p>';

		expect(
			deepFilterHTML( input, [ figureContentReducer ], schema )
		).toEqual( output );
	} );

	it( 'should not move embedded content from paragraph (1)', () => {
		const input = '<p><img>test</p>';

		expect(
			deepFilterHTML( input, [ figureContentReducer ], schema )
		).toEqual( input );
	} );

	it( 'should not move embedded content from paragraph (2)', () => {
		const input = '<p>test<img></p>';

		expect(
			deepFilterHTML( input, [ figureContentReducer ], schema )
		).toEqual( input );
	} );

	it( 'should not move embedded content from paragraph (3)', () => {
		const input = '<p>test<img>test</p>';

		expect(
			deepFilterHTML( input, [ figureContentReducer ], schema )
		).toEqual( input );
	} );

	it( 'should move an anchor with an image', () => {
		const input = '<p><a href="#"><img class="alignleft"></a>test</p>';
		const output =
			'<figure><a href="#"><img class="alignleft"></a></figure><p>test</p>';

		expect(
			deepFilterHTML( input, [ figureContentReducer ], schema )
		).toEqual( output );
	} );
} );
