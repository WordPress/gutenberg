/**
 * Internal dependencies
 */
import { isValidHref, getFormatBoundary } from '../utils';

describe( 'isValidHref', () => {
	it( 'returns true if the href cannot be recognised as a url or an anchor link', () => {
		expect( isValidHref( 'notaurloranchorlink' ) ).toBe( true );
	} );

	it( 'returns false if the href is not specified', () => {
		expect( isValidHref() ).toBe( false );
		expect( isValidHref( '' ) ).toBe( false );
		expect( isValidHref( ' ' ) ).toBe( false );
	} );

	describe( 'URLs beginning with a protocol', () => {
		it( 'returns true for valid URLs', () => {
			expect( isValidHref( 'tel:+123456789' ) ).toBe( true );
			expect( isValidHref( 'mailto:test@somewhere.com' ) ).toBe( true );
			expect( isValidHref( 'file:///c:/WINDOWS/winamp.exe' ) ).toBe(
				true
			);
			expect( isValidHref( 'http://test.com' ) ).toBe( true );
			expect( isValidHref( 'https://test.com' ) ).toBe( true );
			expect( isValidHref( 'http://test-with-hyphen.com' ) ).toBe( true );
			expect( isValidHref( 'http://test.com/' ) ).toBe( true );
			expect( isValidHref( 'http://test.com#fragment' ) ).toBe( true );
			expect( isValidHref( 'http://test.com/path#fragment' ) ).toBe(
				true
			);
			expect(
				isValidHref( 'http://test.com/with/path/separators' )
			).toBe( true );
			expect(
				isValidHref( 'http://test.com/with?query=string&params' )
			).toBe( true );
		} );

		it( 'returns false for invalid urls', () => {
			expect( isValidHref( 'tel:+12 345 6789' ) ).toBe( false );
			expect( isValidHref( 'mailto:test @ somewhere.com' ) ).toBe(
				false
			);
			expect( isValidHref( 'mailto: test@somewhere.com' ) ).toBe( false );
			expect( isValidHref( 'ht#tp://this/is/invalid' ) ).toBe( false );
			expect( isValidHref( 'ht#tp://th&is/is/invalid' ) ).toBe( false );
			expect( isValidHref( 'http:/test.com' ) ).toBe( false );
			expect( isValidHref( 'http://?test.com' ) ).toBe( false );
			expect( isValidHref( 'http://#test.com' ) ).toBe( false );
			expect( isValidHref( 'http://test.com?double?params' ) ).toBe(
				false
			);
			expect( isValidHref( 'http://test.com#double#anchor' ) ).toBe(
				false
			);
			expect( isValidHref( 'http://test.com?path/after/params' ) ).toBe(
				false
			);
			expect( isValidHref( 'http://test.com#path/after/fragment' ) ).toBe(
				false
			);
		} );

		it( 'returns false if the URL has whitespace', () => {
			expect( isValidHref( 'http:/ /test.com' ) ).toBe( false );
			expect( isValidHref( 'http://te st.com' ) ).toBe( false );
			expect( isValidHref( 'http:// test.com' ) ).toBe( false );
			expect( isValidHref( 'http://test.c om' ) ).toBe( false );
			expect( isValidHref( 'http://test.com/ee ee/' ) ).toBe( false );
			expect( isValidHref( 'http://test.com/eeee?qwd qwdw' ) ).toBe(
				false
			);
			expect( isValidHref( 'http://test.com/eeee#qwd qwdw' ) ).toBe(
				false
			);
			expect( isValidHref( 'this: is invalid' ) ).toBe( false );
		} );
	} );

	describe( 'Anchor links', () => {
		it( 'returns true for valid anchor links', () => {
			expect( isValidHref( '#yesitis' ) ).toBe( true );
			expect( isValidHref( '#yes_it_is' ) ).toBe( true );
			expect( isValidHref( '#yes~it~is' ) ).toBe( true );
			expect( isValidHref( '#yes-it-is' ) ).toBe( true );
		} );

		it( 'returns false for invalid anchor links', () => {
			expect( isValidHref( '' ) ).toBe( false );
			expect( isValidHref( '#no-it-isnt#' ) ).toBe( false );
			expect( isValidHref( '#no-it-#isnt' ) ).toBe( false );
			expect( isValidHref( '#no-it-isnt?' ) ).toBe( false );
			expect( isValidHref( '#no-it isnt' ) ).toBe( false );
			expect( isValidHref( '#no-it-isnt/' ) ).toBe( false );
		} );
	} );
} );

describe( 'getFormatBoundary', () => {
	const boldFormat = {
		type: 'core/bold',
	};

	const italicFormat = {
		type: 'core/italic',
	};

	const linkFormat = {
		type: 'core/link',
		attributes: {
			url: 'http://www.wordpress.org',
			type: 'URL',
			id: 'www.wordpress.org',
		},
	};
	it.each( [
		[ 'inside', [ 8, 8 ] ],
		[ 'start', [ 6, 6 ] ],
		[ 'end', [ 10, 10 ] ],
		[ 'insideStart', [ 7, 7 ] ],
		[ 'insideEnd', [ 9, 9 ] ],
	] )(
		'should find bounds of a format from %s of a collapsed RichTextValue',
		( _ignored, [ start, end ] ) => {
			const record = {
				formats: [
					null,
					[ italicFormat ],
					[ italicFormat ],
					[ italicFormat ],
					null,
					null,
					[ linkFormat, italicFormat ], // 6
					[ linkFormat ],
					[ linkFormat, boldFormat ],
					[ linkFormat, boldFormat ],
					[ linkFormat, italicFormat ], // 10
					null,
					null,
					[ boldFormat ],
					[ boldFormat ],
					[ boldFormat ],
					null,
					null,
				],

				text: 'Lorem ipsum dolor.',
				start,
				end,
			};

			expect(
				getFormatBoundary( record, { type: 'core/link' } )
			).toEqual( {
				start: 6,
				end: 10,
			} );
		}
	);

	it.each( [
		[ 'at the bounds', [ 6, 10 ] ],
		[ 'inside the bounds', [ 7, 8 ] ],
	] )(
		'should find bounds of a format beginning %s of a non-collapsed RichTextValue',
		( _ignored, [ start, end ] ) => {
			const record = {
				formats: [
					null,
					[ italicFormat ],
					[ italicFormat ],
					[ italicFormat ],
					null,
					null,
					[ linkFormat, italicFormat ], // 6
					[ linkFormat ],
					[ linkFormat, boldFormat ],
					[ linkFormat, boldFormat ],
					[ linkFormat, italicFormat ], // 10
					null,
					null,
					[ boldFormat ],
					[ boldFormat ],
					[ boldFormat ],
					null,
					null,
				],

				text: 'Lorem ipsum dolor.',
				start,
				end,
			};

			expect(
				getFormatBoundary( record, { type: 'core/link' } )
			).toEqual( {
				start: 6,
				end: 10,
			} );
		}
	);

	it( 'should handle values with pointers at 0 with formats that start at zero-th index', () => {
		const record = {
			formats: [
				[ linkFormat ], // 0
				[ linkFormat ],
				[ linkFormat ],
				[ linkFormat ],
				[ linkFormat ],
				[ linkFormat ], // 5
				[ boldFormat ],
				[ boldFormat ],
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				[ boldFormat ],
				[ boldFormat ],
				[ boldFormat ],
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				[ italicFormat ],
				[ italicFormat ],
				[ italicFormat ],
				[ italicFormat ],
				[ italicFormat ],
				null,
			],

			text: "Lorem ok let's try again dolor.",
			start: 0,
			end: 0,
		};

		expect( getFormatBoundary( record, { type: 'core/link' } ) ).toEqual( {
			start: 0,
			end: 5,
		} );
	} );

	it( 'should return empty bounds if value has no formats', () => {
		const record = {
			formats: [],
			text: 'Lorem ipsum dolor.',
			start: 8,
			end: 8,
		};

		expect( getFormatBoundary( record, { type: 'core/link' } ) ).toEqual( {
			start: null,
			end: null,
		} );
	} );

	it( 'should return empty bounds if start is beyond the format boundary', () => {
		const record = {
			formats: [],
			text: 'Lorem ipsum dolor.',
			start: 1,
			end: 8,
		};

		expect( getFormatBoundary( record, { type: 'core/link' } ) ).toEqual( {
			start: null,
			end: null,
		} );
	} );

	it( 'should return empty bounds if end is beyond the format boundary', () => {
		const record = {
			formats: [],
			text: 'Lorem ipsum dolor.',
			start: 8,
			end: 14,
		};

		expect( getFormatBoundary( record, { type: 'core/link' } ) ).toEqual( {
			start: null,
			end: null,
		} );
	} );
} );
