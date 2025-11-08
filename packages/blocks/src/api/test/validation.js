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
	getNormalizedLength,
	getNormalizedStyleValue,
	getStyleProperties,
	isEqualAttributesOfName,
	isEqualTagAttributePairs,
	isEqualTokensOfType,
	getNextNonWhitespaceToken,
	isEquivalentHTML,
	areOnlyAttributeDifferences,
	validateBlock,
	isClosedByToken,
	VALIDATION_LEVEL,
} from '../validation';
import {
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
	getFreeformContentHandlerName,
	getUnregisteredTypeHandlerName,
} from '../registration';

describe( 'validation', () => {
	const defaultBlockSettings = {
		apiVersion: 3,
		save: ( { attributes } ) => attributes.fruit,
		category: 'text',
		title: 'block title',
	};
	beforeAll( () => {
		// Initialize the block store.
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
			const result = isValidCharacterReference(
				' Test</h2><h2>Test &amp'
			);

			expect( result ).toBe( false );
		} );
	} );

	describe( 'DecodeEntityParser', () => {
		it( 'can be constructed', () => {
			expect(
				new DecodeEntityParser() instanceof DecodeEntityParser
			).toBe( true );
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
				{ chars: 'a \n c \t b  ' }
			);

			expect( console ).toHaveWarned();
			expect( isEqual ).toBe( false );
		} );

		it( 'should return true if equal with collapsed whitespace', () => {
			const isEqual = isEquivalentTextTokens(
				{ chars: '  a \t  b \n c' },
				{ chars: 'a \n b \t c  ' }
			);

			expect( isEqual ).toBe( true );
		} );
	} );

	describe( 'getNormalizedLength()', () => {
		it( 'omits unit from zero px length', () => {
			const normalizedLength = getNormalizedLength( '0px' );

			expect( normalizedLength ).toBe( '0' );
		} );

		it( 'retains unit in non-zero px length', () => {
			const normalizedLength = getNormalizedLength( '50px' );

			expect( normalizedLength ).toBe( '50px' );
		} );

		it( 'omits unit from zero percentage', () => {
			const normalizedLength = getNormalizedLength( '0%' );

			expect( normalizedLength ).toBe( '0' );
		} );

		it( 'retains unit in non-zero percentage', () => {
			const normalizedLength = getNormalizedLength( '50%' );

			expect( normalizedLength ).toBe( '50%' );
		} );

		it( 'adds leading zero to percentage', () => {
			const normalizedLength = getNormalizedLength( '.5%' );

			expect( normalizedLength ).toBe( '0.5%' );
		} );
	} );

	describe( 'getNormalizedStyleValue()', () => {
		it( 'omits whitespace and quotes from url value', () => {
			const normalizedValue = getNormalizedStyleValue(
				'url( "https://wordpress.org/img.png" )'
			);

			expect( normalizedValue ).toBe(
				'url(https://wordpress.org/img.png)'
			);
		} );

		it( 'omits length units from zero values', () => {
			const normalizedValue =
				getNormalizedStyleValue( '44% 0% 18em 0em' );

			expect( normalizedValue ).toBe( '44% 0 18em 0' );
		} );

		it( 'add leading zero to units that have it missing', () => {
			const normalizedValue = getNormalizedStyleValue( '.23% .75em' );

			expect( normalizedValue ).toBe( '0.23% 0.75em' );
		} );

		it( 'leaves zero values in calc() expressions alone', () => {
			const normalizedValue =
				getNormalizedStyleValue( 'calc(0em + 5px)' );

			expect( normalizedValue ).toBe( 'calc(0em + 5px)' );
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
					'b a c'
				);

				expect( isEqual ).toBe( true );
			} );

			it( 'ignores whitespace', () => {
				const isEqual = isEqualAttributesOfName.class(
					'a  b    c',
					'b   a c'
				);

				expect( isEqual ).toBe( true );
			} );

			it( 'returns false if not equal', () => {
				const isEqual = isEqualAttributesOfName.class(
					'a b c',
					'b a c d'
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
				const isEqual = isEqualAttributesOfName.controls( 'true', '' );

				expect( isEqual ).toBe( true );
			} );
		} );
	} );

	describe( 'isEqualTagAttributePairs()', () => {
		it( 'returns false if not equal pairs', () => {
			const isEqual = isEqualTagAttributePairs(
				[ [ 'class', 'b   a c' ] ],
				[
					[ 'class', 'c  a b' ],
					[
						'style',
						'background-image: url( "https://wordpress.org/img.png" ); color: red;',
					],
				]
			);

			expect( console ).toHaveWarned();
			expect( isEqual ).toBe( false );
		} );

		it( 'returns true if equal pairs', () => {
			const isEqual = isEqualTagAttributePairs(
				[
					[ 'class', 'b   a c' ],
					[
						'style',
						'color: red;  background-image: url( "https://wordpress.org/img.png" );',
					],
					[ 'controls', '' ],
				],
				[
					[ 'class', 'c  a b' ],
					[
						'style',
						'background-image: url( "https://wordpress.org/img.png" ); color: red;',
					],
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
						attributes: [ [ 'class', 'b   a c' ] ],
					},
					{
						tagName: 'p',
						attributes: [
							[ 'class', 'c  a b' ],
							[
								'style',
								'background-image: url( "https://wordpress.org/img.png" ); color: red;',
							],
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
							[
								'style',
								'color: red;  background-image: url( "https://wordpress.org/img.png" );',
							],
						],
					},
					{
						tagName: 'p',
						attributes: [
							[ 'class', 'c  a b' ],
							[
								'style',
								'background-image: url( "https://wordpress.org/img.png" ); color: red;',
							],
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
			const tokens = [ { type: 'Chars', chars: '   \n\t' } ];

			const token = getNextNonWhitespaceToken( tokens );

			expect( token ).toBeUndefined();
			expect( tokens ).toHaveLength( 0 );
		} );
	} );

	describe( 'isClosedByToken()', () => {
		it( 'should return true if self-closed token is closed by an end token', () => {
			const isClosed = isClosedByToken(
				{ type: 'StartTag', tagName: 'div', selfClosing: true },
				{ type: 'EndTag', tagName: 'div' }
			);

			expect( isClosed ).toBe( true );
		} );

		it( 'should return false if open token is not closed by an end token', () => {
			const isClosed = isClosedByToken(
				{ type: 'StartTag', tagName: 'div', selfClosing: false },
				{ type: 'EndTag', tagName: 'div' }
			);

			expect( isClosed ).toBe( false );
		} );

		it( 'should return false if self-closed token has a different name to the end token', () => {
			const isClosed = isClosedByToken(
				{ type: 'StartTag', tagName: 'div', selfClosing: true },
				{ type: 'EndTag', tagName: 'span' }
			);

			expect( isClosed ).toBe( false );
		} );

		it( 'should return false if self-closed token is not closed by a start token', () => {
			const isClosed = isClosedByToken(
				{ type: 'StartTag', tagName: 'div', selfClosing: true },
				{ type: 'StartTag', tagName: 'div' }
			);

			expect( isClosed ).toBe( false );
		} );

		it( 'should return false if self-closed token is not closed by an undefined token', () => {
			const isClosed = isClosedByToken(
				{ type: 'StartTag', tagName: 'div', selfClosing: true },
				undefined
			);

			expect( isClosed ).toBe( false );
		} );
	} );

	describe( 'isEquivalentHTML()', () => {
		it( 'should return true for identical markup', () => {
			const isEquivalent = isEquivalentHTML(
				'<div>Hello <span class="b">World!</span></div>',
				'<div>Hello <span class="b">World!</span></div>'
			);

			expect( isEquivalent ).toBe( true );
		} );

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
			const isEquivalent = isEquivalentHTML( '<div data-foo>', '<div>' );

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
			const isEquivalent = isEquivalentHTML( '', '' );

			expect( isEquivalent ).toBe( true );
		} );

		it( 'should return false if supplied malformed HTML', () => {
			const isEquivalent = isEquivalentHTML(
				'<blockquote class="wp-block-quote">fsdfsdfsd<p>fdsfsdfsdd</pfd fd fd></blockquote>',
				'<blockquote class="wp-block-quote">fsdfsdfsd<p>fdsfsdfsdd</p></blockquote>'
			);

			expect( console ).toHaveWarned();
			expect( isEquivalent ).toBe( false );
		} );

		it( 'should return false if supplied two sets of malformed HTML', () => {
			const isEquivalent = isEquivalentHTML(
				'<div>fsdfsdfsd<p>fdsfsdfsdd</pfd fd fd></div>',
				'<blockquote>fsdfsdfsd<p>fdsfsdfsdd</p a></blockquote>'
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

	describe( 'validateBlock()', () => {
		it( 'returns false if block is not valid', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			const [ isValid ] = validateBlock( {
				name: 'core/test-block',
				attrs: {
					fruit: 'Bananas',
				},
				originalContent: 'Apples',
			} );

			expect( isValid ).toBe( false );
		} );

		it( 'returns false if error occurs while generating block save', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				save() {
					throw new Error();
				},
			} );

			const [ isValid ] = validateBlock( {
				name: 'core/test-block',
				attrs: {
					fruit: 'Bananas',
				},
				originalContent: 'Bananas',
			} );

			expect( isValid ).toBe( false );
		} );

		it( 'returns true is block is valid', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			const [ isValid ] = validateBlock( {
				name: 'core/test-block',
				attributes: { fruit: 'Bananas' },
				originalContent: 'Bananas',
			} );

			expect( isValid ).toBe( true );
		} );
	} );

	describe( 'areOnlyAttributeDifferences()', () => {
		it( 'should return false for empty issues array', () => {
			// Empty array means no issues were found, which shouldn't happen
			// at Level 2 (Level 0 would have passed). Return false to be safe.
			const result = areOnlyAttributeDifferences( [] );

			expect( result ).toBe( false );
		} );

		it( 'should return true for attribute-only issues', () => {
			const issues = [
				{
					log: jest.fn(),
					args: [
						'Expected attribute `class` of value `foo`, saw `bar`.',
					],
				},
			];
			const result = areOnlyAttributeDifferences( issues );

			expect( result ).toBe( true );
		} );

		it( 'should return true for attributes array differences', () => {
			const issues = [
				{
					log: jest.fn(),
					args: [ 'Expected attributes Array(2), saw Array(1).' ],
				},
			];
			const result = areOnlyAttributeDifferences( issues );

			expect( result ).toBe( true );
		} );

		it( 'should return false for tag name differences', () => {
			const issues = [
				{
					log: jest.fn(),
					args: [ 'Expected tag name `h2`, instead saw `span`.' ],
				},
			];
			const result = areOnlyAttributeDifferences( issues );

			expect( result ).toBe( false );
		} );

		it( 'should return false when content ends unexpectedly', () => {
			const issues = [
				{
					log: jest.fn(),
					args: [ 'Expected <p>, instead saw end of content.' ],
				},
			];
			const result = areOnlyAttributeDifferences( issues );

			expect( result ).toBe( false );
		} );

		it( 'should return false when unexpected content found', () => {
			const issues = [
				{
					log: jest.fn(),
					args: [
						'Expected end of content, instead saw <p>Extra</p>.',
					],
				},
			];
			const result = areOnlyAttributeDifferences( issues );

			expect( result ).toBe( false );
		} );

		it( 'should return false if any issue is structural', () => {
			const issues = [
				{
					log: jest.fn(),
					args: [ 'Expected attribute `class` of value `foo`.' ],
				},
				{
					log: jest.fn(),
					args: [ 'Expected tag name `div`, instead saw `span`.' ],
				},
			];
			const result = areOnlyAttributeDifferences( issues );

			expect( result ).toBe( false );
		} );

		it( 'should return false for text content differences', () => {
			const issues = [
				{
					log: jest.fn(),
					args: [ 'Text content differs' ],
				},
			];
			const result = areOnlyAttributeDifferences( issues );

			// Text differences are NOT considered attribute differences
			// Conservative approach: only accept specific attribute messages
			expect( result ).toBe( false );
		} );

		it( 'should return false for non-attribute issue types', () => {
			const issues = [
				{
					log: jest.fn(),
					args: [ 'Some non-attribute validation issue' ],
				},
			];
			const result = areOnlyAttributeDifferences( issues );

			// Conservative approach: only accept specific attribute messages
			// Everything else is rejected to avoid false positives
			expect( result ).toBe( false );
		} );
	} );

	describe( 'Validation Levels - Level 0: ValidBlock', () => {
		it( 'should validate identical content as ValidBlock', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				save: ( { attributes } ) => attributes.content,
			} );

			const [ isValid ] = validateBlock( {
				name: 'core/test-block',
				attributes: { content: 'Hello World' },
				originalContent: 'Hello World',
			} );

			expect( isValid ).toBe( true );
		} );

		it( 'should validate with whitespace normalization', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				save: ( { attributes } ) => attributes.text,
			} );

			const [ isValid ] = validateBlock( {
				name: 'core/test-block',
				attributes: { text: 'Hello   World' },
				originalContent: 'Hello World',
			} );

			expect( isValid ).toBe( true );
		} );

		it( 'should validate blocks using existing test pattern', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			const [ isValid ] = validateBlock( {
				name: 'core/test-block',
				attributes: { fruit: 'Apples' },
				originalContent: 'Apples',
			} );

			expect( isValid ).toBe( true );
		} );
	} );

	describe( 'Validation Levels - Level 1: MigratedBlock', () => {
		it( 'should validate via block deprecation', () => {
			registerBlockType( 'core/deprecated-block', {
				...defaultBlockSettings,
				attributes: {
					value: { type: 'string', default: '' },
				},
				save: ( { attributes } ) => attributes.value,
				deprecated: [
					{
						attributes: {
							oldValue: { type: 'string', default: '' },
						},
						save: ( { attributes } ) => attributes.oldValue,
						migrate: ( attributes ) => ( {
							value: attributes.oldValue,
						} ),
					},
				],
			} );

			// Use the parser's parseRawBlock since Level 1 requires deprecation checking
			const { parseRawBlock } = require( '../parser' );

			const rawBlock = {
				blockName: 'core/deprecated-block',
				attrs: { oldValue: 'Deprecated Content' },
				innerHTML: 'Deprecated Content',
				innerBlocks: [],
				innerContent: [ 'Deprecated Content' ],
			};

			// Skip migration console logs in tests
			const options = { __unstableSkipMigrationLogs: true };
			const parsedBlock = parseRawBlock( rawBlock, options );

			expect( parsedBlock.isValid ).toBe( true );
			expect( parsedBlock.validationLevel ).toBe(
				VALIDATION_LEVEL.MIGRATED_BLOCK
			);
			expect( parsedBlock.attributes.value ).toBe( 'Deprecated Content' );
		} );
	} );

	describe( 'Validation Levels - Level 2: ReconstructedBlock', () => {
		it( 'should validate when class names are generated from attributes', () => {
			registerBlockType( 'core/heading', {
				...defaultBlockSettings,
				attributes: {
					level: { type: 'number', default: 2 },
					textColor: { type: 'string' },
				},
				save: ( { attributes } ) => {
					const className = attributes.textColor
						? `has-${ attributes.textColor }-color has-text-color`
						: '';
					return attributes.level === 6
						? `<h6 class="${ className }">Testing Header</h6>`
						: '<h2>Testing Header</h2>';
				},
			} );

			// Without block delimiters, test the actual scenario
			// This matches real-world usage where innerHTML has missing classes
			const [ isValid ] = validateBlock( {
				name: 'core/heading',
				attributes: { level: 6, textColor: 'pale-pink' },
				originalContent: '<h6>Testing Header</h6>',
			} );

			expect( isValid ).toBe( true );
		} );

		it( 'should validate when structure matches but attributes differ', () => {
			registerBlockType( 'core/paragraph', {
				...defaultBlockSettings,
				attributes: {
					content: { type: 'string' },
					textColor: { type: 'string' },
				},
				save: ( { attributes } ) => {
					const className = attributes.textColor
						? `has-${ attributes.textColor }-color has-text-color`
						: '';
					return `<p class="${ className }">${ attributes.content }</p>`;
				},
			} );

			// Same structure (p tag), different attributes (missing color classes)
			const [ isValid, , metadata ] = validateBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Hello World', textColor: 'red' },
				originalContent: '<p>Hello World</p>',
			} );

			expect( isValid ).toBe( true );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.RECONSTRUCTED_BLOCK
			);
		} );

		it( 'should NOT validate when HTML tag structure differs (without allowsReconstruction)', () => {
			registerBlockType( 'core/heading-invalid', {
				...defaultBlockSettings,
				allowsReconstruction: false, // Disable to ensure tag differences fail
				attributes: {
					content: { type: 'string' },
				},
				save: ( { attributes } ) => `<h2>${ attributes.content }</h2>`,
			} );

			// Different structure: span vs h2 - should fail
			const [ isValid, issues, metadata ] = validateBlock( {
				name: 'core/heading-invalid',
				attributes: { content: 'Header' },
				originalContent: '<span>Header</span>',
			} );

			expect( isValid ).toBe( false );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.INVALID_BLOCK
			);
			expect( issues.length ).toBeGreaterThan( 0 );
		} );

		it( 'should pass Level 2 when only attributes differ', () => {
			registerBlockType( 'core/paragraph', {
				...defaultBlockSettings,
				attributes: {
					content: { type: 'string' },
					className: { type: 'string' },
				},
				save: ( { attributes } ) => {
					const className = attributes.className || '';
					return `<p class="${ className }">${ attributes.content }</p>`;
				},
			} );

			// Same structure, just missing class attribute
			const [ isValid, , metadata ] = validateBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Content', className: 'my-class' },
				originalContent: '<p>Content</p>',
			} );

			expect( isValid ).toBe( true );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.RECONSTRUCTED_BLOCK
			);
		} );
	} );

	describe( 'Validation Levels - Level 3: RegeneratedBlock', () => {
		it( 'should regenerate when text content differs', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				attributes: {
					content: { type: 'string' },
				},
				save: ( { attributes } ) => attributes.content,
			} );

			// Level 3 trusts the attributes and will regenerate HTML from them
			// Attributes say "Server rendered", HTML has "Client rendered"
			// Level 3 will regenerate as "Server rendered"
			const [ isValid, , metadata ] = validateBlock( {
				name: 'core/test-block',
				attributes: { content: 'Server rendered' },
				originalContent: 'Client rendered',
			} );

			expect( console ).toHaveLogged();
			expect( isValid ).toBe( true );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.REGENERATED_BLOCK
			);
		} );

		it( 'should regenerate when HTML tag differs from attributes', () => {
			registerBlockType( 'core/heading', {
				...defaultBlockSettings,
				attributes: {
					content: { type: 'string' },
					level: { type: 'number', default: 2 },
				},
				save: ( { attributes } ) => {
					const Tag = `h${ attributes.level }`;
					return `<${ Tag }>${ attributes.content }</${ Tag }>`;
				},
			} );

			// Attributes say level:3 (h3), but HTML has h2
			// Level 3 should accept this and regenerate from attributes
			const [ isValid, , metadata ] = validateBlock( {
				name: 'core/heading',
				attributes: { content: 'Testing Header', level: 3 },
				originalContent: '<h2>Testing Header</h2>',
			} );

			expect( console ).toHaveLogged();
			expect( isValid ).toBe( true );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.REGENERATED_BLOCK
			);
		} );

		it( 'should NOT regenerate when allowsReconstruction is false', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				allowsReconstruction: false, // Explicitly opt out of Level 3
				attributes: {
					content: { type: 'string' },
				},
				save: ( { attributes } ) => attributes.content,
			} );

			// Text content differs, but allowsReconstruction=false blocks Level 3
			const [ isValid, , metadata ] = validateBlock( {
				name: 'core/test-block',
				attributes: { content: 'Server rendered' },
				originalContent: 'Client rendered',
			} );

			expect( isValid ).toBe( false );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.INVALID_BLOCK
			);
		} );

		it( 'should handle freeform blocks as valid', () => {
			// Freeform blocks preserve raw HTML unchanged, so they're always valid
			const freeformName = getFreeformContentHandlerName();
			const [ isValid, , metadata ] = validateBlock( {
				name: freeformName,
				attributes: {},
				originalContent: '<p>Classic editor content</p>',
			} );

			expect( isValid ).toBe( true );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.VALID_BLOCK
			);
		} );

		it( 'should handle missing block handler as valid', () => {
			// The missing block handler wraps unknown blocks and preserves content.
			// In normal parsing, unknown blocks are wrapped by the parser before
			// validation, so they arrive as the missing handler type.
			const missingHandlerName = getUnregisteredTypeHandlerName();
			const [ isValid, , metadata ] = validateBlock( {
				name: missingHandlerName,
				attributes: {
					originalName: 'plugin/unknown-block',
					originalContent: '<p>Content from unknown block</p>',
				},
				originalContent: '<p>Content from unknown block</p>',
			} );

			expect( isValid ).toBe( true );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.VALID_BLOCK
			);
		} );
	} );

	describe( 'Validation Levels - Level 4: InvalidBlock', () => {
		it( 'should invalidate when block type is not registered (direct API call)', () => {
			// Direct validateBlock call with non-existent type.
			// In normal parsing, the parser wraps unknown blocks in the
			// missing block handler first. This tests direct API usage.
			const [ isValid, issues, metadata ] = validateBlock( {
				name: 'core/nonexistent-block',
				attributes: {},
				originalContent: '<p>Content</p>',
			} );

			expect( isValid ).toBe( false );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.INVALID_BLOCK
			);
			expect( issues.length ).toBeGreaterThan( 0 );
		} );

		it( 'should invalidate completely different content', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				allowsReconstruction: false, // Disable Level 3 to ensure this fails
				save: ( { attributes } ) => attributes.expected,
			} );

			const [ isValid, issues ] = validateBlock( {
				name: 'core/test-block',
				attributes: { expected: 'Expected content' },
				originalContent: 'Completely different content',
			} );

			expect( isValid ).toBe( false );
			expect( issues.length ).toBeGreaterThan( 0 );
		} );

		it( 'should invalidate when HTML structure completely changes', () => {
			registerBlockType( 'core/heading', {
				...defaultBlockSettings,
				allowsReconstruction: false, // Disable Level 3
				save: () => '<h2>Testing Header</h2>',
			} );

			// Source has span wrapping, but heading should have h2
			// This would require changing block type to paragraph, so it's invalid
			const [ isValid, issues ] = validateBlock( {
				name: 'core/heading',
				attributes: {},
				originalContent: '<span>Testing Header</span>',
			} );

			expect( isValid ).toBe( false );
			expect( issues.length ).toBeGreaterThan( 0 );
		} );

		it( 'should invalidate when allowsReconstruction is false and content differs', () => {
			registerBlockType( 'core/strict-block', {
				...defaultBlockSettings,
				allowsReconstruction: false,
				attributes: {
					content: { type: 'string' },
				},
				save: ( { attributes } ) => attributes.content,
			} );

			// Text content differs and allowsReconstruction is false
			const [ isValid, issues, metadata ] = validateBlock( {
				name: 'core/strict-block',
				attributes: { content: 'Expected content' },
				originalContent: 'Different content',
			} );

			expect( isValid ).toBe( false );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.INVALID_BLOCK
			);
			expect( issues.length ).toBeGreaterThan( 0 );
		} );

		it( 'should invalidate when save function throws error', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				save: () => {
					throw new Error( 'Save error' );
				},
			} );

			const [ isValid, issues ] = validateBlock( {
				name: 'core/test-block',
				attributes: {},
				originalContent: 'Content',
			} );

			expect( isValid ).toBe( false );
			expect( issues.length ).toBeGreaterThan( 0 );
		} );

		it( 'should invalidate when attributes cause different output', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				allowsReconstruction: false, // Disable Level 2
				attributes: {
					text: { type: 'string' },
				},
				save: ( { attributes } ) => attributes.text,
			} );

			const [ isValid, issues ] = validateBlock( {
				name: 'core/test-block',
				attributes: { text: 'red text' },
				originalContent: 'blue text',
			} );

			expect( isValid ).toBe( false );
			expect( issues.length ).toBeGreaterThan( 0 );
		} );

		it( 'should invalidate when content size difference exceeds threshold', () => {
			registerBlockType( 'core/threshold-block', {
				...defaultBlockSettings,
				attributes: {
					content: { type: 'string' },
				},
				save: ( { attributes } ) => <p>{ attributes.content }</p>,
			} );

			// Original content is much larger than what save() produces
			// Generated: <p>Short</p> (~12 chars)
			// Original: ~200 chars
			// Generated < Original * 0.5 → significant content loss
			const [ isValid, , metadata ] = validateBlock( {
				name: 'core/threshold-block',
				attributes: { content: 'Short' },
				originalContent:
					'<p>This is a very long piece of content that is much much longer than what the save function would produce from the attributes. It contains lots of extra text that would be lost during reconstruction.</p>',
			} );

			expect( isValid ).toBe( false );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.INVALID_BLOCK
			);
		} );

		it( 'should invalidate when generated content is empty but original has content', () => {
			registerBlockType( 'core/empty-block', {
				...defaultBlockSettings,
				attributes: {
					content: { type: 'string' },
				},
				// save() produces empty output when content is missing
				save: ( { attributes } ) =>
					attributes.content ? <p>{ attributes.content }</p> : null,
			} );

			// Attributes don't contain content, so save() returns null
			// But original has substantial content that would be lost
			const [ isValid, , metadata ] = validateBlock( {
				name: 'core/empty-block',
				attributes: {},
				originalContent:
					'<p>This content exists in the original but cannot be regenerated because the content attribute is missing.</p>',
			} );

			expect( isValid ).toBe( false );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.INVALID_BLOCK
			);
		} );
	} );

	describe( 'Backward Compatibility', () => {
		it( 'should maintain array return format with metadata as third element', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			const result = validateBlock( {
				name: 'core/test-block',
				attributes: { fruit: 'Bananas' },
				originalContent: 'Bananas',
			} );

			expect( Array.isArray( result ) ).toBe( true );
			expect( result ).toHaveLength( 3 ); // Now returns [isValid, issues, metadata]
			expect( typeof result[ 0 ] ).toBe( 'boolean' );
			expect( Array.isArray( result[ 1 ] ) ).toBe( true );
			expect( typeof result[ 2 ] ).toBe( 'object' ); // metadata object
			expect( result[ 2 ].validationLevel ).toBeDefined();
		} );

		it( 'should support destructuring with legacy pattern', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			// Users can still destructure as [isValid, issues] - they just ignore metadata
			const [ isValid, issues ] = validateBlock( {
				name: 'core/test-block',
				attributes: { fruit: 'Bananas' },
				originalContent: 'Bananas',
			} );

			expect( isValid ).toBe( true );
			expect( issues ).toEqual( [] );
		} );

		it( 'should return false for invalid blocks with text differences', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				allowsReconstruction: false, // Disable Level 2 to ensure it fails
			} );

			const [ isValid, issues ] = validateBlock( {
				name: 'core/test-block',
				attributes: { fruit: 'Bananas' },
				originalContent: 'Apples',
			} );

			expect( isValid ).toBe( false );
			expect( issues.length ).toBeGreaterThan( 0 );
		} );
	} );
} );
