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

	describe( 'Invalid values', () => {
		it( 'should return empty bounds if value contains no formats', () => {
			const record = {
				formats: [], // No formats here!
				text: 'Lorem ipsum dolor.',
				start: 8,
				end: 8,
			};

			expect(
				getFormatBoundary( record, { type: 'core/link' } )
			).toEqual( {
				start: null,
				end: null,
			} );
		} );

		it.each( [
			[ 5, 12 ],
			[ 11, 12 ],
		] )(
			'should return empty bounds if both start and end indexes do not contain the target format',
			() => {
				const record = {
					formats: [
						null,
						[ italicFormat ],
						[ italicFormat ],
						[ italicFormat ],
						null,
						null, // 5.
						[ linkFormat, italicFormat ], // 6.
						[ linkFormat ],
						[ linkFormat, boldFormat ],
						[ linkFormat, boldFormat ],
						[ linkFormat, italicFormat ], // 10.
						null, // 11.
						[ boldFormat ], // 12.
						[ boldFormat ],
						[ boldFormat ],
						[ boldFormat ],
						null,
						null,
					],

					text: 'Lorem ipsum dolor.',
					start: 5, // No format here.
					end: 12, // Format here but it doesn't match the target format.
				};

				expect(
					getFormatBoundary( record, { type: 'core/link' } )
				).toEqual( {
					start: null,
					end: null,
				} );
			}
		);

		it.each( [
			[
				"start and end are beyond the length of the provided value's formats",
				[ 19, 22 ],
			],
			[ 'start and end are less than 0', [ -1, -2 ] ],
		] )(
			'should return empty bounds if %s',
			( _ignored, [ start, end ] ) => {
				const record = {
					formats: [
						null,
						[ italicFormat ],
						[ italicFormat ],
						[ italicFormat ],
						null,
						null, // 5.
						[ linkFormat, italicFormat ], // 6.
						[ linkFormat ],
						[ linkFormat, boldFormat ],
						[ linkFormat, boldFormat ],
						[ linkFormat, italicFormat ], // 10.
						null, // 11.
						[ boldFormat ], // 12.
						[ boldFormat ],
						[ boldFormat ],
						[ boldFormat ],
						null,
						null, // 17.
					],

					text: 'Lorem ipsum dolor.',
					start,
					end,
				};

				expect(
					getFormatBoundary( record, { type: 'core/link' } )
				).toEqual( {
					start: null,
					end: null,
				} );
			}
		);
	} );

	describe( 'Collapsed values', () => {
		it.each( [
			[ 'inside', [ 8, 8 ] ],
			[ 'start', [ 6, 6 ] ],
			[ 'end', [ 10, 10 ] ],
			[ 'just inside the start', [ 7, 7 ] ],
			[ 'just inside the end', [ 9, 9 ] ],
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
						[ linkFormat, italicFormat ], // 6.
						[ linkFormat ],
						[ linkFormat, boldFormat ],
						[ linkFormat, boldFormat ],
						[ linkFormat, italicFormat ], // 10.
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

		it( 'should find bounds of a format from just outside the end of a collapsed RichTextValue', () => {
			// This is an edge case which will occur if you create a format, then place
			// the caret just before the format and hit the back ARROW key. The resulting
			// value object will have start and end +1 beyond the edge of the format boundary.
			// The code under test here has to cope with that by searching for formats -1 back
			// from the end value.
			const record = {
				formats: [
					null,
					[ italicFormat ],
					[ italicFormat ],
					[ italicFormat ],
					null,
					null,
					[ linkFormat, italicFormat ], // 6.
					[ linkFormat ],
					[ linkFormat, boldFormat ],
					[ linkFormat, boldFormat ],
					[ linkFormat, italicFormat ], // 10.
				],

				text: 'Lorem ipsum dolor.',
				start: 11, // +1 beyond the end of the formats.
				end: 11, // +1 beyond the end of the formats.
			};

			expect(
				getFormatBoundary( record, { type: 'core/link' } )
			).toEqual( {
				start: 6,
				end: 10,
			} );
		} );
	} );

	describe( 'Non-collapsed values', () => {
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
						[ linkFormat, italicFormat ], // 6.
						[ linkFormat ],
						[ linkFormat, boldFormat ],
						[ linkFormat, boldFormat ],
						[ linkFormat, italicFormat ], // 10.
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
	} );

	it( 'should find bounds of a format which starts at zeroth index where start/end pointers are at 0', () => {
		const record = {
			formats: [
				[ linkFormat ], // 0 (th zeroth index)
				[ linkFormat ],
				[ linkFormat ],
				[ linkFormat ],
				[ linkFormat ],
				[ linkFormat ], // 5.
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

	describe( 'Single value out of bounds', () => {
		it.each( [
			[ 'start is outside the boundary but end is inside', [ 1, 4 ] ],
			[ 'end is outside the boundary but start is inside', [ 4, 10 ] ],
			[
				'end is withins bounds but is less than start (inverted)',
				[ 4, 1 ],
			],
			[ 'start is negative but end is within bounds', [ -1000, 4 ] ],
			[ 'end is negative but start is within bounds', [ 4, -1000 ] ],
		] )( 'should return bounds when %s', ( _ignored, [ start, end ] ) => {
			const record = {
				formats: [
					[],
					[],
					[],
					[],
					[ boldFormat ], // 4.
					[ boldFormat ],
					[ boldFormat ], // 6.
					[],
					[],
				],
				text: 'Lorem ipsum dolor.',
				start,
				end,
			};

			expect(
				getFormatBoundary( record, { type: 'core/bold' } )
			).toEqual( {
				start: 4,
				end: 6,
			} );
		} );
	} );

	it( 'should respect startIndex and endIndex arguments when seeking boundary', () => {
		const startIndex = 1;
		const endIndex = 3;

		const record = {
			formats: [
				[ boldFormat ],
				[ boldFormat ],
				[ boldFormat ],
				[ boldFormat ],
				[ boldFormat ],
				[],
				[],
				[],
				[],
				[],
			],
			text: 'Lorem ipsum dolor.',
			start: 10, // the value start is outside the format
			end: 10, // the value end is outside the format
		};

		expect(
			getFormatBoundary(
				record,
				{ type: 'core/bold' },
				startIndex,
				endIndex
			)
		).toEqual( {
			start: 0,
			end: 4,
		} );
	} );
} );
