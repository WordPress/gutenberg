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
	validateBlock,
	isClosedByToken,
	VALIDATION_LEVEL,
	VALIDATION_LEVEL_NAME,
	extractBlockInnerHTML,
	createValidationResult,
} from '../validation';
import {
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
} from '../registration';

describe( 'validation', () => {
	const defaultBlockSettings = {
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

	describe( 'VALIDATION_LEVEL constants', () => {
		it( 'should have correct numeric values ordered by confidence', () => {
			expect( VALIDATION_LEVEL.VALID_BLOCK ).toBe( 0 );
			expect( VALIDATION_LEVEL.MIGRATED_BLOCK ).toBe( 1 );
			expect( VALIDATION_LEVEL.PRESERVED_SOURCE ).toBe( 2 );
			expect( VALIDATION_LEVEL.RECONSTRUCTED_SOURCE ).toBe( 3 );
			expect( VALIDATION_LEVEL.RAW_TRANSFORMED_SOURCE ).toBe( 4 );
			expect( VALIDATION_LEVEL.INVALID_BLOCK ).toBe( 5 );
		} );

		it( 'should have human-readable names for each level', () => {
			expect(
				VALIDATION_LEVEL_NAME[ VALIDATION_LEVEL.VALID_BLOCK ]
			).toBe( 'ValidBlock' );
			expect(
				VALIDATION_LEVEL_NAME[ VALIDATION_LEVEL.MIGRATED_BLOCK ]
			).toBe( 'MigratedBlock' );
			expect(
				VALIDATION_LEVEL_NAME[ VALIDATION_LEVEL.PRESERVED_SOURCE ]
			).toBe( 'PreservedSource' );
			expect(
				VALIDATION_LEVEL_NAME[ VALIDATION_LEVEL.RECONSTRUCTED_SOURCE ]
			).toBe( 'ReconstructedSource' );
			expect(
				VALIDATION_LEVEL_NAME[ VALIDATION_LEVEL.RAW_TRANSFORMED_SOURCE ]
			).toBe( 'RawTransformedSource' );
			expect(
				VALIDATION_LEVEL_NAME[ VALIDATION_LEVEL.INVALID_BLOCK ]
			).toBe( 'InvalidBlock' );
		} );
	} );

	describe( 'extractBlockInnerHTML()', () => {
		it( 'should extract innerHTML from block with attributes', () => {
			const content =
				'<!-- wp:paragraph {"align":"center"} --><p class="has-text-align-center">Hello World</p><!-- /wp:paragraph -->';
			const innerHTML = extractBlockInnerHTML( content );

			expect( innerHTML ).toBe(
				'<p class="has-text-align-center">Hello World</p>'
			);
		} );

		it( 'should extract innerHTML from block without attributes', () => {
			const content =
				'<!-- wp:paragraph --><p>Hello World</p><!-- /wp:paragraph -->';
			const innerHTML = extractBlockInnerHTML( content );

			expect( innerHTML ).toBe( '<p>Hello World</p>' );
		} );

		it( 'should handle self-closing blocks', () => {
			const content = '<!-- wp:separator /-->';
			const innerHTML = extractBlockInnerHTML( content );

			expect( innerHTML ).toBe( '' );
		} );

		it( 'should handle empty content', () => {
			const innerHTML = extractBlockInnerHTML( '' );

			expect( innerHTML ).toBe( '' );
		} );

		it( 'should handle content with nested blocks (returns outer HTML only)', () => {
			const content =
				'<!-- wp:group --><div class="wp-block-group"><!-- wp:paragraph --><p>Nested</p><!-- /wp:paragraph --></div><!-- /wp:group -->';
			const innerHTML = extractBlockInnerHTML( content );

			expect( innerHTML ).toBe(
				'<div class="wp-block-group"><!-- wp:paragraph --><p>Nested</p><!-- /wp:paragraph --></div>'
			);
		} );
	} );

	describe( 'createValidationResult()', () => {
		it( 'should create result with validationLevel and isValid getter', () => {
			const result = createValidationResult(
				VALIDATION_LEVEL.VALID_BLOCK
			);

			expect( result.validationLevel ).toBe( 0 );
			expect( result.isValid ).toBe( true );
			expect( result.validationIssues ).toEqual( [] );
		} );

		it( 'should mark INVALID_BLOCK as not valid', () => {
			const result = createValidationResult(
				VALIDATION_LEVEL.INVALID_BLOCK
			);

			expect( result.validationLevel ).toBe( 5 );
			expect( result.isValid ).toBe( false );
		} );

		it( 'should mark all other levels as valid', () => {
			const levels = [
				VALIDATION_LEVEL.VALID_BLOCK,
				VALIDATION_LEVEL.MIGRATED_BLOCK,
				VALIDATION_LEVEL.PRESERVED_SOURCE,
				VALIDATION_LEVEL.RECONSTRUCTED_SOURCE,
				VALIDATION_LEVEL.RAW_TRANSFORMED_SOURCE,
			];

			levels.forEach( ( level ) => {
				const result = createValidationResult( level );
				expect( result.isValid ).toBe( true );
			} );
		} );

		it( 'should include validation issues if provided', () => {
			const mockLog = jest.fn();
			const issues = [ { log: mockLog, args: [ 'Test error' ] } ];
			const result = createValidationResult(
				VALIDATION_LEVEL.INVALID_BLOCK,
				issues
			);

			expect( result.validationIssues ).toEqual( issues );
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

	describe( 'Validation Levels - Level 2: PreservedSource', () => {
		it( 'should validate when innerHTML matches but block attributes differ', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				attributes: {
					content: { type: 'string' },
				},
				save: ( { attributes } ) => attributes.content,
			} );

			// Original content has block delimiters with attributes
			// but the innerHTML portion is the same as what save generates
			const [ isValid ] = validateBlock( {
				name: 'core/test-block',
				attributes: { content: 'Hello' },
				originalContent:
					'<!-- wp:test-block {"content":"Hello","extraAttr":"value"} -->Hello<!-- /wp:test-block -->',
			} );

			expect( isValid ).toBe( true );
		} );

		it( 'should validate when only block comment attributes differ', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				attributes: {
					text: { type: 'string' },
				},
				save: ( { attributes } ) => attributes.text,
			} );

			// The actual HTML content is identical, only the comment attributes differ
			const [ isValid ] = validateBlock( {
				name: 'core/test-block',
				attributes: { text: 'Content' },
				originalContent:
					'<!-- wp:test-block {"text":"Content","color":"red"} -->Content<!-- /wp:test-block -->',
			} );

			expect( isValid ).toBe( true );
		} );
	} );

	describe( 'Validation Levels - Level 3: ReconstructedSource', () => {
		it( 'should validate when block explicitly allows reconstruction', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				allowsReconstruction: true,
				attributes: {
					content: { type: 'string' },
				},
				save: ( { attributes } ) => attributes.content,
			} );

			// innerHTML differs due to server-side rendering or dynamic content
			const [ isValid ] = validateBlock( {
				name: 'core/test-block',
				attributes: { content: 'Server rendered' },
				originalContent: 'Client rendered',
			} );

			expect( isValid ).toBe( true );
		} );

		it( 'should not validate reconstruction if not explicitly allowed', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				// allowsReconstruction not set (defaults to undefined)
				attributes: {
					content: { type: 'string' },
				},
				save: ( { attributes } ) => attributes.content,
			} );

			const [ isValid ] = validateBlock( {
				name: 'core/test-block',
				attributes: { content: 'Server rendered' },
				originalContent: 'Client rendered',
			} );

			expect( isValid ).toBe( false );
		} );
	} );

	describe( 'Validation Levels - Level 5: InvalidBlock', () => {
		it( 'should invalidate completely different content', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
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
	} );

	describe( 'Backward Compatibility', () => {
		it( 'should maintain array return format [isValid, issues]', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			const result = validateBlock( {
				name: 'core/test-block',
				attributes: { fruit: 'Bananas' },
				originalContent: 'Bananas',
			} );

			expect( Array.isArray( result ) ).toBe( true );
			expect( result ).toHaveLength( 2 );
			expect( typeof result[ 0 ] ).toBe( 'boolean' );
			expect( Array.isArray( result[ 1 ] ) ).toBe( true );
		} );

		it( 'should return true for valid blocks in legacy format', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			const [ isValid, issues ] = validateBlock( {
				name: 'core/test-block',
				attributes: { fruit: 'Bananas' },
				originalContent: 'Bananas',
			} );

			expect( isValid ).toBe( true );
			expect( issues ).toEqual( [] );
		} );

		it( 'should return false for invalid blocks in legacy format', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

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
