/**
 * Internal dependencies
 */
import {
	isValidCharacterReference,
	DecodeEntityParser,
	getTextPiecesSplitOnWhitespace,
	getTextWithCollapsedWhitespace,
	getMeaningfulAttributePairs,
	isEquivalentTextTokens,
	getNormalizedStyleValue,
	getStyleProperties,
	isEqualAttributesOfName,
	isEqualTagAttributePairs,
	isEqualTokensOfType,
	getNextNonWhitespaceToken,
	isEquivalentHTML,
	isValidBlockContent,
	isClosedByToken,
} from '../validation';
import {
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
	getBlockType,
} from '../registration';

describe( 'validation', () => {
	const defaultBlockSettings = {
		save: ( { attributes } ) => attributes.fruit,
		category: 'common',
		title: 'block title',
	};
	beforeAll( () => {
		// Initialize the block store
		require( '../../store' );
	} );

	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'isValidCharacterReference', () => {
		it( 'returns true for a named character reference', () => {
			const result = isValidCharacterReference( 'blk12' );

			expect( result ).toBe( true );
		} );

		it( 'returns true for a decimal character reference', () => {
			const result = isValidCharacterReference( '#33' );

			expect( result ).toBe( true );
		} );

		it( 'returns true for a hexadecimal character reference', () => {
			const result = isValidCharacterReference( '#xC6' );

			expect( result ).toBe( true );
		} );

		it( 'returns false for an invalid character reference', () => {
			const result = isValidCharacterReference( ' Test</h2><h2>Test &amp' );

			expect( result ).toBe( false );
		} );
	} );

	describe( 'DecodeEntityParser', () => {
		it( 'can be constructed', () => {
			expect( new DecodeEntityParser() instanceof DecodeEntityParser ).toBe( true );
		} );

		it( 'returns parse as decoded value', () => {
			expect( new DecodeEntityParser().parse( 'quot' ) ).toBe( '"' );
		} );
	} );

	describe( 'getTextPiecesSplitOnWhitespace()', () => {
		it( 'returns text pieces spilt on whitespace', () => {
			const pieces = getTextPiecesSplitOnWhitespace( '  a \t  b \n c' );

			expect( pieces ).toEqual( [ 'a', 'b', 'c' ] );
		} );
	} );

	describe( 'getTextWithCollapsedWhitespace()', () => {
		it( 'returns text with collapsed whitespace', () => {
			const pieces = getTextWithCollapsedWhitespace( '  a \t  b \n c' );

			expect( pieces ).toBe( 'a b c' );
		} );
	} );

	describe( 'getMeaningfulAttributePairs()', () => {
		it( 'returns with non-empty attributes', () => {
			const pairs = getMeaningfulAttributePairs( {
				attributes: [ [ 'class', 'a' ] ],
			} );

			expect( pairs ).toEqual( [ [ 'class', 'a' ] ] );
		} );

		it( 'returns without empty non-boolean, non-enumerated attributes', () => {
			const pairs = getMeaningfulAttributePairs( {
				attributes: [ [ 'class', '' ] ],
			} );

			expect( pairs ).toEqual( [] );
		} );

		it( 'returns with empty boolean attributes', () => {
			const pairs = getMeaningfulAttributePairs( {
				attributes: [ [ 'disabled', '' ] ],
			} );

			expect( pairs ).toEqual( [ [ 'disabled', '' ] ] );
		} );

		it( 'returns with empty enumerated attributes', () => {
			const pairs = getMeaningfulAttributePairs( {
				attributes: [ [ 'contenteditable', '' ] ],
			} );

			expect( pairs ).toEqual( [ [ 'contenteditable', '' ] ] );
		} );

		it( 'returns with empty data- attributes', () => {
			const pairs = getMeaningfulAttributePairs( {
				attributes: [ [ 'data-foo', '' ] ],
			} );

			expect( pairs ).toEqual( [ [ 'data-foo', '' ] ] );
		} );
	} );

	describe( 'isEquivalentTextTokens()', () => {
		it( 'should return false if not equal with collapsed whitespace', () => {
			const isEqual = isEquivalentTextTokens(
				{ chars: '  a \t  b \n c' },
				{ chars: 'a \n c \t b  ' },
			);

			expect( console ).toHaveWarned();
			expect( isEqual ).toBe( false );
		} );

		it( 'should return true if equal with collapsed whitespace', () => {
			const isEqual = isEquivalentTextTokens(
				{ chars: '  a \t  b \n c' },
				{ chars: 'a \n b \t c  ' },
			);

			expect( isEqual ).toBe( true );
		} );
	} );

	describe( 'getNormalizedStyleValue()', () => {
		it( 'omits whitespace and quotes from url value', () => {
			const normalizedValue = getNormalizedStyleValue(
				'url( "https://wordpress.org/img.png" )'
			);

			expect( normalizedValue ).toBe( 'url(https://wordpress.org/img.png)' );
		} );
	} );

	describe( 'getStyleProperties()', () => {
		it( 'returns style property pairs', () => {
			const pairs = getStyleProperties(
				'background-image: url( "https://wordpress.org/img.png" ); color: red;'
			);

			expect( pairs ).toEqual( {
				'background-image': 'url(https://wordpress.org/img.png)',
				color: 'red',
			} );
		} );
	} );

	describe( 'isEqualAttributesOfName', () => {
		describe( '.class()', () => {
			it( 'ignores ordering', () => {
				const isEqual = isEqualAttributesOfName.class(
					'a b c',
					'b a c',
				);

				expect( isEqual ).toBe( true );
			} );

			it( 'ignores whitespace', () => {
				const isEqual = isEqualAttributesOfName.class(
					'a  b    c',
					'b   a c',
				);

				expect( isEqual ).toBe( true );
			} );

			it( 'returns false if not equal', () => {
				const isEqual = isEqualAttributesOfName.class(
					'a b c',
					'b a c d',
				);

				expect( isEqual ).toBe( false );
			} );
		} );

		describe( '.style()', () => {
			it( 'returns true if the same style', () => {
				const isEqual = isEqualAttributesOfName.style(
					'background-image: url( "https://wordpress.org/img.png" ); color: red;',
					"color: red;   background-image: url('https://wordpress.org/img.png\n);"
				);

				expect( isEqual ).toBe( true );
			} );

			it( 'returns false if not same style', () => {
				const isEqual = isEqualAttributesOfName.style(
					'background-image: url( "https://wordpress.org/img.png" ); color: red;',
					"color: red;  font-size: 13px; background-image: url('https://wordpress.org/img.png');"
				);

				expect( isEqual ).toBe( false );
			} );
		} );

		describe( 'boolean attributes', () => {
			it( 'returns true if both present', () => {
				const isEqual = isEqualAttributesOfName.controls(
					'true',
					''
				);

				expect( isEqual ).toBe( true );
			} );
		} );
	} );

	describe( 'isEqualTagAttributePairs()', () => {
		it( 'returns false if not equal pairs', () => {
			const isEqual = isEqualTagAttributePairs(
				[
					[ 'class', 'b   a c' ],
				],
				[
					[ 'class', 'c  a b' ],
					[ 'style', 'background-image: url( "https://wordpress.org/img.png" ); color: red;' ],
				]
			);

			expect( console ).toHaveWarned();
			expect( isEqual ).toBe( false );
		} );

		it( 'returns true if equal pairs', () => {
			const isEqual = isEqualTagAttributePairs(
				[
					[ 'class', 'b   a c' ],
					[ 'style', 'color: red;  background-image: url( "https://wordpress.org/img.png" );' ],
					[ 'controls', '' ],
				],
				[
					[ 'class', 'c  a b' ],
					[ 'style', 'background-image: url( "https://wordpress.org/img.png" ); color: red;' ],
					[ 'controls', 'true' ],
				]
			);

			expect( isEqual ).toBe( true );
		} );

		it( 'returns true if case-insensitive equal pairs', () => {
			const isEqual = isEqualTagAttributePairs(
				[
					[ 'ID', 'foo' ],
					[ 'class', 'a b' ],
					[ 'Style', 'color: red;' ],
				],
				[
					[ 'id', 'foo' ],
					[ 'CLASS', 'a b' ],
					[ 'style', 'color: red;' ],
				]
			);

			expect( isEqual ).toBe( true );
		} );
	} );

	describe( 'isEqualTokensOfType', () => {
		describe( '.StartTag()', () => {
			it( 'returns false if tag name not the same', () => {
				const isEqual = isEqualTokensOfType.StartTag(
					{ tagName: 'p' },
					{ tagName: 'section' }
				);

				expect( console ).toHaveWarned();
				expect( isEqual ).toBe( false );
			} );

			it( 'returns false if tag name the same but attributes not', () => {
				const isEqual = isEqualTokensOfType.StartTag(
					{
						tagName: 'p',
						attributes: [
							[ 'class', 'b   a c' ],
						],
					},
					{
						tagName: 'p',
						attributes: [
							[ 'class', 'c  a b' ],
							[ 'style', 'background-image: url( "https://wordpress.org/img.png" ); color: red;' ],
						],
					}
				);

				expect( console ).toHaveWarned();
				expect( isEqual ).toBe( false );
			} );

			it( 'returns true if tag name the same and attributes the same', () => {
				const isEqual = isEqualTokensOfType.StartTag(
					{
						tagName: 'p',
						attributes: [
							[ 'class', 'b   a c' ],
							[ 'style', 'color: red;  background-image: url( "https://wordpress.org/img.png" );' ],
						],
					},
					{
						tagName: 'p',
						attributes: [
							[ 'class', 'c  a b' ],
							[ 'style', 'background-image: url( "https://wordpress.org/img.png" ); color: red;' ],
						],
					}
				);

				expect( isEqual ).toBe( true );
			} );

			it( 'returns true if tag and attributes names are case insensitive the same', () => {
				const isEqual = isEqualTokensOfType.StartTag(
					{
						tagName: 'P',
						attributes: [
							[ 'CLASS', 'a b' ],
							[ 'style', 'color: red;' ],
						],
					},
					{
						tagName: 'p',
						attributes: [
							[ 'class', 'a b' ],
							[ 'Style', 'color: red;' ],
						],
					}
				);

				expect( isEqual ).toBe( true );
			} );
		} );
	} );

	describe( 'getNextNonWhitespaceToken()', () => {
		it( 'returns the next non-whitespace token, mutating array', () => {
			const tokens = [
				{ type: 'Chars', chars: '   \n\t' },
				{ type: 'StartTag', tagName: 'p' },
			];

			const token = getNextNonWhitespaceToken( tokens );

			expect( token ).toEqual( { type: 'StartTag', tagName: 'p' } );
			expect( tokens ).toHaveLength( 0 );
		} );

		it( 'returns undefined if token options exhausted', () => {
			const tokens = [
				{ type: 'Chars', chars: '   \n\t' },
			];

			const token = getNextNonWhitespaceToken( tokens );

			expect( token ).toBeUndefined();
			expect( tokens ).toHaveLength( 0 );
		} );
	} );

	describe( 'isClosedByToken()', () => {
		it( 'should return true if self-closed token is closed by an end token', () => {
			const isClosed = isClosedByToken(
				{ type: 'StartTag', tagName: 'div', selfClosing: true },
				{ type: 'EndTag', tagName: 'div' },
			);

			expect( isClosed ).toBe( true );
		} );

		it( 'should return false if open token is not closed by an end token', () => {
			const isClosed = isClosedByToken(
				{ type: 'StartTag', tagName: 'div', selfClosing: false },
				{ type: 'EndTag', tagName: 'div' },
			);

			expect( isClosed ).toBe( false );
		} );

		it( 'should return false if self-closed token has a different name to the end token', () => {
			const isClosed = isClosedByToken(
				{ type: 'StartTag', tagName: 'div', selfClosing: true },
				{ type: 'EndTag', tagName: 'span' },
			);

			expect( isClosed ).toBe( false );
		} );

		it( 'should return false if self-closed token is not closed by a start token', () => {
			const isClosed = isClosedByToken(
				{ type: 'StartTag', tagName: 'div', selfClosing: true },
				{ type: 'StartTag', tagName: 'div' },
			);

			expect( isClosed ).toBe( false );
		} );

		it( 'should return false if self-closed token is not closed by an undefined token', () => {
			const isClosed = isClosedByToken(
				{ type: 'StartTag', tagName: 'div', selfClosing: true },
				undefined,
			);

			expect( isClosed ).toBe( false );
		} );
	} );

	describe( 'isEquivalentHTML()', () => {
		it( 'should return false for effectively inequivalent html', () => {
			const isEquivalent = isEquivalentHTML(
				'<div>Hello <span class="b">World!</span></div>',
				'<div>Hello <span class="a">World!</span></div>'
			);

			expect( console ).toHaveWarned();
			expect( isEquivalent ).toBe( false );
		} );

		it( 'should return true for effectively equivalent html', () => {
			const isEquivalent = isEquivalentHTML(
				'<div>&quot; Hello<SPAN   class="b a" ID="foo" data-foo="here &mdash; there"> World! &#128517;</  SPAN>  "</div>',
				'<div  >" Hello\n<span id="foo" class="a  b" data-foo="here — there">World! 😅</span>"</div>'
			);

			expect( isEquivalent ).toBe( true );
		} );

		it( 'should account for character reference validity', () => {
			// Regression: Previously the validator would wrongly evaluate the
			// segment of text ` Test</h2><h2>Test &amp` as a character
			// reference, as it's between an opening `&` and terminating `;`.
			//
			// See: https://github.com/WordPress/gutenberg/issues/12448
			const isEquivalent = isEquivalentHTML(
				'<h2>Test &amp; Test</h2><h2>Test &amp; Test</h2>',
				'<h2>Test & Test</h2><h2>Test &amp; Test</h2>'
			);

			expect( isEquivalent ).toBe( true );
		} );

		it( 'should return false when more tokens in first', () => {
			const isEquivalent = isEquivalentHTML(
				'<div>Hello</div>',
				'<div>Hello'
			);

			expect( console ).toHaveWarned();
			expect( isEquivalent ).toBe( false );
		} );

		it( 'should return false when more tokens in second', () => {
			const isEquivalent = isEquivalentHTML(
				'<div>Hello',
				'<div>Hello</div>'
			);

			expect( console ).toHaveWarned();
			expect( isEquivalent ).toBe( false );
		} );

		it( 'should return true when first has trailing whitespace', () => {
			const isEquivalent = isEquivalentHTML(
				'<div>Hello</div>  ',
				'<div>Hello</div>'
			);

			expect( isEquivalent ).toBe( true );
		} );

		it( 'should return true when second has trailing whitespace', () => {
			const isEquivalent = isEquivalentHTML(
				'<div>Hello</div>',
				'<div>Hello</div>  '
			);

			expect( isEquivalent ).toBe( true );
		} );

		it( 'should return true when difference of empty non-boolean, non-enumerated attribute', () => {
			const isEquivalent = isEquivalentHTML(
				'<div class="">Hello</div>',
				'<div>Hello</div>'
			);

			expect( isEquivalent ).toBe( true );
		} );

		it( 'should return false when difference of empty boolean attribute', () => {
			const isEquivalent = isEquivalentHTML(
				'<input disabled>',
				'<input>'
			);

			expect( console ).toHaveWarned();
			expect( isEquivalent ).toBe( false );
		} );

		it( 'should return false when difference of empty enumerated attribute', () => {
			const isEquivalent = isEquivalentHTML(
				'<div contenteditable>',
				'<div>'
			);

			expect( console ).toHaveWarned();
			expect( isEquivalent ).toBe( false );
		} );

		it( 'should return false when difference of data- attribute', () => {
			const isEquivalent = isEquivalentHTML(
				'<div data-foo>',
				'<div>'
			);

			expect( console ).toHaveWarned();
			expect( isEquivalent ).toBe( false );
		} );

		it( 'should return false when difference of boolean attribute', () => {
			const isEquivalent = isEquivalentHTML(
				'<video controls></video>',
				'<video></video>'
			);

			expect( console ).toHaveWarned();
			expect( isEquivalent ).toBe( false );
		} );

		it( 'should return true when same boolean attribute', () => {
			const isEquivalent = isEquivalentHTML(
				'<video controls></video>',
				'<video controls></video>'
			);

			expect( isEquivalent ).toBe( true );
		} );

		it( 'should return true when effectively same boolean attribute', () => {
			const isEquivalent = isEquivalentHTML(
				'<video controls></video>',
				'<video controls=""></video>'
			);

			expect( isEquivalent ).toBe( true );
		} );

		it( 'should return true when comparing empty strings', () => {
			const isEquivalent = isEquivalentHTML(
				'',
				'',
			);

			expect( isEquivalent ).toBe( true );
		} );

		it( 'should return false if supplied malformed HTML', () => {
			const isEquivalent = isEquivalentHTML(
				'<blockquote class="wp-block-quote">fsdfsdfsd<p>fdsfsdfsdd</pfd fd fd></blockquote>',
				'<blockquote class="wp-block-quote">fsdfsdfsd<p>fdsfsdfsdd</p></blockquote>',
			);

			expect( console ).toHaveWarned();
			expect( isEquivalent ).toBe( false );
		} );

		it( 'should return false if supplied two sets of malformed HTML', () => {
			const isEquivalent = isEquivalentHTML(
				'<div>fsdfsdfsd<p>fdsfsdfsdd</pfd fd fd></div>',
				'<blockquote>fsdfsdfsd<p>fdsfsdfsdd</p a></blockquote>',
			);

			expect( console ).toHaveWarned();
			expect( isEquivalent ).toBe( false );
		} );

		it( 'should return true when comparing self-closing and normal tags', () => {
			let isEquivalent = isEquivalentHTML(
				'<path d="M0,0h24v24H0V0z M0,0h24v24H0V0z" fill="none" />',
				'<path d="M0,0h24v24H0V0z M0,0h24v24H0V0z" fill="none"></path>'
			);

			expect( isEquivalent ).toBe( true );

			isEquivalent = isEquivalentHTML(
				'<path d="M0,0h24v24H0V0z M0,0h24v24H0V0z" fill="none"></path>',
				'<path d="M0,0h24v24H0V0z M0,0h24v24H0V0z" fill="none" />'
			);

			expect( isEquivalent ).toBe( true );
		} );

		it( 'should return true when comparing self-closing and normal tags, ignoring trailing space', () => {
			let isEquivalent = isEquivalentHTML(
				'<path d="M0,0h24v24H0V0z M0,0h24v24H0V0z" fill="none"/>',
				'<path d="M0,0h24v24H0V0z M0,0h24v24H0V0z" fill="none"></path>'
			);

			expect( isEquivalent ).toBe( true );

			isEquivalent = isEquivalentHTML(
				'<path d="M0,0h24v24H0V0z M0,0h24v24H0V0z" fill="none"></path>',
				'<path d="M0,0h24v24H0V0z M0,0h24v24H0V0z" fill="none"/>'
			);

			expect( isEquivalent ).toBe( true );
		} );
	} );

	describe( 'isValidBlockContent()', () => {
		it( 'returns false if block is not valid', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			const isValid = isValidBlockContent(
				'core/test-block',
				{ fruit: 'Bananas' },
				'Apples'
			);

			expect( console ).toHaveWarned();
			expect( console ).toHaveErrored();
			expect( isValid ).toBe( false );
		} );

		it( 'returns false if error occurs while generating block save', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				save() {
					throw new Error();
				},
			} );

			const isValid = isValidBlockContent(
				'core/test-block',
				{ fruit: 'Bananas' },
				'Bananas'
			);

			expect( console ).toHaveErrored();
			expect( isValid ).toBe( false );
		} );

		it( 'returns true is block is valid', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			const isValid = isValidBlockContent(
				'core/test-block',
				{ fruit: 'Bananas' },
				'Bananas'
			);

			expect( isValid ).toBe( true );
		} );

		it( 'works also when block type object is passed as object', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			const isValid = isValidBlockContent(
				getBlockType( 'core/test-block' ),
				{ fruit: 'Bananas' },
				'Bananas'
			);

			expect( isValid ).toBe( true );
		} );
	} );
} );
