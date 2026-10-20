import { afterEach, describe, expect, it } from 'vitest';
import { createElement, RawHTML } from '@wordpress/element';
import '../../store';
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
	isEquivalentHTMLStructure,
	areAttributesPreserved,
	getContentTokens,
	isContentPreserved,
	validateBlock,
	isClosedByToken,
	VALIDATION_LEVEL,
} from '../validation';
import { parseRawBlock } from '../parser';
import {
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
	getFreeformContentHandlerName,
	getUnregisteredTypeHandlerName,
	setFreeformContentHandlerName,
	setUnregisteredTypeHandlerName,
} from '../registration';

describe( 'validation', () => {
	const defaultBlockSettings = {
		apiVersion: 3,
		save: ( { attributes } ) => attributes.fruit,
		category: 'text',
		title: 'block title',
	};
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

	describe( 'areAttributesPreserved()', () => {
		it( 'returns true when attributes are added or values change', () => {
			expect(
				areAttributesPreserved(
					[ [ 'href', 'https://a.example' ] ],
					[
						[ 'href', 'https://b.example' ],
						[ 'target', '_blank' ],
					]
				)
			).toBe( true );
			expect( areAttributesPreserved( [], [ [ 'class', 'x' ] ] ) ).toBe(
				true
			);
		} );

		it( 'ignores the case of attribute names', () => {
			expect(
				areAttributesPreserved(
					[ [ 'DATA-Foo', 'a' ] ],
					[ [ 'data-foo', 'b' ] ]
				)
			).toBe( true );
		} );

		it( 'returns false when an attribute is dropped', () => {
			expect(
				areAttributesPreserved( [ [ 'data-track', 'hero' ] ], [] )
			).toBe( false );
			expect(
				areAttributesPreserved(
					[ [ 'hidden', '' ] ],
					[ [ 'class', 'x' ] ]
				)
			).toBe( false );
			expect( console ).toHaveWarned();
		} );

		it( 'returns false when a class name or style property is dropped', () => {
			expect(
				areAttributesPreserved(
					[ [ 'class', 'has-blue-color custom' ] ],
					[ [ 'class', 'has-red-color custom' ] ]
				)
			).toBe( false );
			expect(
				areAttributesPreserved(
					[ [ 'style', 'color:red;border-radius:2px' ] ],
					[ [ 'style', 'border-radius:4px' ] ]
				)
			).toBe( false );
			// Property names are compared as own properties only.
			expect(
				areAttributesPreserved(
					[ [ 'style', 'constructor:1' ] ],
					[ [ 'style', 'color:red' ] ]
				)
			).toBe( false );
			expect( console ).toHaveWarned();
		} );
	} );

	describe( 'isEquivalentHTMLStructure()', () => {
		it( 'returns true for identical markup', () => {
			expect(
				isEquivalentHTMLStructure( '<p>Hello</p>', '<p>Hello</p>' )
			).toBe( true );
		} );

		it( 'returns true when only attributes differ', () => {
			expect(
				isEquivalentHTMLStructure(
					'<h6>Testing Header</h6>',
					'<h6 class="has-pale-pink-color has-text-color">Testing Header</h6>'
				)
			).toBe( true );
			expect(
				isEquivalentHTMLStructure(
					'<div class="wp-block-button"><a class="wp-block-button__link" href="https://a.example">Go</a></div>',
					'<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="https://b.example">Go</a></div>'
				)
			).toBe( true );
		} );

		it( 'returns true when attribute differences are followed by matching content', () => {
			expect(
				isEquivalentHTMLStructure(
					'<figure class="wp-block-image"><img src="a.png"/><figcaption>Caption</figcaption></figure>',
					'<figure class="wp-block-image size-large"><img src="a.png" alt=""/><figcaption class="wp-element-caption">Caption</figcaption></figure>'
				)
			).toBe( true );
		} );

		it( 'returns false when tag names differ', () => {
			expect(
				isEquivalentHTMLStructure( '<h2>Title</h2>', '<h3>Title</h3>' )
			).toBe( false );
			expect(
				isEquivalentHTMLStructure(
					'<span>Title</span>',
					'<h2 class="wp-block-heading">Title</h2>'
				)
			).toBe( false );
			expect( console ).toHaveWarned();
		} );

		it( 'returns false when text differs', () => {
			expect(
				isEquivalentHTMLStructure(
					'<p>Client rendered</p>',
					'<p class="x">Server rendered</p>'
				)
			).toBe( false );
			expect( console ).toHaveWarned();
		} );

		it( 'returns false when the original has extra elements after an attribute difference', () => {
			// `isEquivalentHTML` stops at the first (attribute) mismatch; the
			// structural comparison must keep going and spot the extra element.
			expect(
				isEquivalentHTMLStructure(
					'<p>Text</p><p>Extra</p>',
					'<p class="x">Text</p>'
				)
			).toBe( false );
			expect( console ).toHaveWarned();
		} );

		it( 'returns false when a stored attribute, class name or style property would be dropped', () => {
			expect(
				isEquivalentHTMLStructure(
					'<p data-track="hero">Text</p>',
					'<p class="x">Text</p>'
				)
			).toBe( false );
			expect(
				isEquivalentHTMLStructure(
					'<p class="has-blue-color custom">Text</p>',
					'<p class="has-red-color has-text-color custom">Text</p>'
				)
			).toBe( false );
			expect(
				isEquivalentHTMLStructure(
					'<a style="background-color:#f00;border-radius:2px">Go</a>',
					'<a class="wp-element-button" style="border-radius:2px">Go</a>'
				)
			).toBe( false );
			expect( console ).toHaveWarned();
		} );

		it( 'returns true when attribute values change but nothing is dropped', () => {
			expect(
				isEquivalentHTMLStructure(
					'<a style="border-radius:2px" href="https://a.example">Go</a>',
					'<a style="border-radius:4px" href="https://b.example" target="_blank">Go</a>'
				)
			).toBe( true );
		} );

		it( 'returns false when the generated markup has extra elements', () => {
			expect(
				isEquivalentHTMLStructure(
					'<h2>Title</h2>',
					'<h2 class="wp-block-heading">Title</h2><p></p>'
				)
			).toBe( false );
			expect( console ).toHaveWarned();
		} );

		it( 'returns false for malformed markup', () => {
			expect(
				isEquivalentHTMLStructure(
					'<p>aaaa <img src onerror=alert(1)></x dde></x>1',
					'<p>aaaa <img src="">1</p>'
				)
			).toBe( false );
			expect( console ).toHaveWarned();
		} );
	} );

	describe( 'getContentTokens()', () => {
		it( 'returns the words of text content, ignoring tags and presentational attributes', () => {
			expect(
				getContentTokens(
					'<h2 class="wp-block-heading" title="Ignored">Hello <em>big</em>\n	world</h2>'
				)
			).toEqual( [ 'Hello', 'big', 'world' ] );
		} );

		it( 'ignores comments and decodes entities', () => {
			expect(
				getContentTokens( '<!-- not text --><p>Fish &amp; Chips</p>' )
			).toEqual( [ 'Fish', '&', 'Chips' ] );
		} );

		it( 'includes media sources, link targets and alternative text', () => {
			expect(
				getContentTokens(
					'<figure class="wp-block-image"><img src="a.png" alt="A cat" class="wp-image-1"/><figcaption><a href="https://a.example/?x=1&amp;y=2">Cap</a></figcaption></figure>'
				)
			).toEqual( [
				'Cap',
				'src=a.png',
				'alt=A cat',
				'href=https://a.example/?x=1&y=2',
			] );
		} );

		it( 'returns an empty array when there is no content', () => {
			expect( getContentTokens( '' ) ).toEqual( [] );
			expect(
				getContentTokens( '<hr class="wp-block-separator"/>' )
			).toEqual( [] );
			expect( getContentTokens( '<img src="" alt=""/>' ) ).toEqual( [] );
		} );

		it( 'interprets malformed markup the way a browser renders it', () => {
			expect(
				getContentTokens(
					'<p>aaaa <img src onerror=alert(1)></x dde></x>1'
				)
			).toEqual( [ 'aaaa', '1' ] );
			// A `<` which does not start a tag is text.
			expect(
				getContentTokens( '<p>1 < 2 and <3 and 3 > 2</p>' )
			).toEqual( [ '1', '<', '2', 'and', '<3', 'and', '3', '>', '2' ] );
		} );
	} );

	describe( 'isContentPreserved()', () => {
		it( 'returns true when the generated markup contains all original text', () => {
			expect(
				isContentPreserved(
					'<h3>Title</h3>',
					'<h2 class="wp-block-heading">Title</h2>'
				)
			).toBe( true );
		} );

		it( 'returns true when the generated markup adds text', () => {
			expect(
				isContentPreserved(
					'<p>Intro</p>',
					'<p>Intro</p><p>Read more</p>'
				)
			).toBe( true );
		} );

		it( 'returns true when the original has no content', () => {
			expect(
				isContentPreserved(
					'<div class="wp-block-spacer"></div>',
					'<div class="wp-block-spacer" style="height:100px"></div>'
				)
			).toBe( true );
		} );

		it( 'returns true regardless of whitespace and entity encoding', () => {
			expect(
				isContentPreserved(
					'<p>Fish &amp;\n	Chips</p>',
					'<p>Fish &amp; Chips</p>'
				)
			).toBe( true );
		} );

		it( 'returns true when media is kept in a different structure', () => {
			expect(
				isContentPreserved(
					'<img src="a.png" alt="Bare"/>',
					'<figure class="wp-block-image"><img src="a.png" alt="Bare"/></figure>'
				)
			).toBe( true );
		} );

		it( 'returns false when text would be dropped', () => {
			expect(
				isContentPreserved(
					'<h2>Title</h2><p>Intro</p>',
					'<h2 class="wp-block-heading">Title</h2>'
				)
			).toBe( false );
			expect(
				isContentPreserved(
					'<p class="wp-block-heading">Some content</p>',
					'<h2 class="wp-block-heading"></h2>'
				)
			).toBe( false );
			// Text following a `<` which does not start a tag.
			expect(
				isContentPreserved(
					'<h2>Title</h2><p><3 lost text</p>',
					'<h2 class="wp-block-heading">Title</h2>'
				)
			).toBe( false );
		} );

		it( 'returns false when media or links would be dropped', () => {
			expect(
				isContentPreserved(
					'<figure class="wp-block-image"><img src="a.png"/><img src="b.png"/></figure>',
					'<figure class="wp-block-image"><img src="a.png"/></figure>'
				)
			).toBe( false );
			expect(
				isContentPreserved(
					'<cite><a href="https://a.example">Me</a></cite>',
					'<cite>Me</cite>'
				)
			).toBe( false );
		} );

		it( 'returns false when text is replaced', () => {
			expect(
				isContentPreserved( 'Client rendered', 'Server rendered' )
			).toBe( false );
		} );

		it( 'accounts for repeated words', () => {
			expect(
				isContentPreserved( '<p>one</p><p>one</p>', '<p>one</p>' )
			).toBe( false );
		} );

		it( 'does not consider the order of words', () => {
			// Tokens are compared as a multiset: reordered text counts as
			// preserved, which keeps the check simple and predictable.
			expect(
				isContentPreserved( '<p>World Hello</p>', '<p>Hello World</p>' )
			).toBe( true );
		} );
	} );

	describe( 'Validation Levels - Level 0: ValidBlock', () => {
		it( 'should validate identical content as ValidBlock', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				save: ( { attributes } ) => attributes.content,
			} );

			const [ isValid, issues, metadata ] = validateBlock( {
				name: 'core/test-block',
				attributes: { content: 'Hello World' },
				originalContent: 'Hello World',
			} );

			expect( isValid ).toBe( true );
			expect( issues ).toEqual( [] );
			expect( metadata ).toEqual( {
				validationLevel: VALIDATION_LEVEL.VALID_BLOCK,
				originalContent: 'Hello World',
				generatedContent: 'Hello World',
			} );
		} );

		it( 'should validate with whitespace normalization', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				save: ( { attributes } ) => attributes.text,
			} );

			const [ isValid, , metadata ] = validateBlock( {
				name: 'core/test-block',
				attributes: { text: 'Hello   World' },
				originalContent: 'Hello World',
			} );

			expect( isValid ).toBe( true );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.VALID_BLOCK
			);
		} );

		it( 'should treat freeform content as valid', () => {
			// Freeform content preserves its raw HTML unchanged.
			setFreeformContentHandlerName( 'core/freeform' );
			try {
				const [ isValid, , metadata ] = validateBlock( {
					name: getFreeformContentHandlerName(),
					attributes: {},
					originalContent: '<p>Classic editor content</p>',
				} );

				expect( isValid ).toBe( true );
				expect( metadata.validationLevel ).toBe(
					VALIDATION_LEVEL.VALID_BLOCK
				);
			} finally {
				setFreeformContentHandlerName( undefined );
			}
		} );

		it( 'should treat the unregistered block handler as valid', () => {
			// The parser wraps unknown blocks in the missing block handler
			// before validation, which preserves their content as-is.
			setUnregisteredTypeHandlerName( 'core/missing' );
			try {
				const [ isValid, , metadata ] = validateBlock( {
					name: getUnregisteredTypeHandlerName(),
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
			} finally {
				setUnregisteredTypeHandlerName( undefined );
			}
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

			// Level 1 is assigned by the parser when deprecations are tried.
			const parsedBlock = parseRawBlock(
				{
					blockName: 'core/deprecated-block',
					attrs: { oldValue: 'Deprecated Content' },
					innerHTML: 'Deprecated Content',
					innerBlocks: [],
					innerContent: [ 'Deprecated Content' ],
				},
				{ __unstableSkipMigrationLogs: true }
			);

			expect( parsedBlock.isValid ).toBe( true );
			expect( parsedBlock.validationLevel ).toBe(
				VALIDATION_LEVEL.MIGRATED_BLOCK
			);
			expect( parsedBlock.attributes.value ).toBe( 'Deprecated Content' );
		} );

		it( 'should prefer a matching deprecation over reconstruction', () => {
			registerBlockType( 'core/deprecated-block', {
				...defaultBlockSettings,
				attributes: {
					content: { type: 'string', source: 'html', selector: 'p' },
				},
				save: ( { attributes } ) =>
					createElement(
						'p',
						{ className: 'wp-block-deprecated' },
						attributes.content
					),
				deprecated: [
					{
						attributes: {
							content: {
								type: 'string',
								source: 'html',
								selector: 'p',
							},
						},
						save: ( { attributes } ) =>
							createElement( 'p', null, attributes.content ),
						migrate: ( attributes ) => ( {
							content: `${ attributes.content }!`,
						} ),
					},
				],
			} );

			// The stored content is only an attribute (class name) away from
			// the current `save` output, so it could be reconstructed at Level
			// 2, but the deprecation matches exactly and must win.
			const parsedBlock = parseRawBlock(
				{
					blockName: 'core/deprecated-block',
					attrs: {},
					innerHTML: '<p>Hello</p>',
					innerBlocks: [],
					innerContent: [ '<p>Hello</p>' ],
				},
				{ __unstableSkipMigrationLogs: true }
			);

			expect( parsedBlock.isValid ).toBe( true );
			expect( parsedBlock.validationLevel ).toBe(
				VALIDATION_LEVEL.MIGRATED_BLOCK
			);
			expect( parsedBlock.attributes.content ).toBe( 'Hello!' );
		} );

		it( 'should not migrate through a deprecation which only matches structurally', () => {
			registerBlockType( 'core/paragraph', {
				...defaultBlockSettings,
				attributes: {
					content: { type: 'string', source: 'html', selector: 'p' },
					migrated: { type: 'boolean', default: false },
				},
				save: ( { attributes } ) =>
					createElement(
						'p',
						{ className: 'wp-block-paragraph' },
						attributes.content
					),
				deprecated: [
					{
						attributes: {
							content: {
								type: 'string',
								source: 'html',
								selector: 'p',
							},
						},
						save: ( { attributes } ) =>
							createElement(
								'p',
								{ className: 'legacy' },
								attributes.content
							),
						migrate: ( attributes ) => ( {
							...attributes,
							migrated: true,
						} ),
					},
				],
			} );

			// The stored markup differs from the deprecated `save` only by a
			// class name, which is not enough for a deprecation: the block is
			// reconstructed from the current `save` instead.
			const parsedBlock = parseRawBlock(
				{
					blockName: 'core/paragraph',
					attrs: {},
					innerHTML: '<p>Content</p>',
					innerBlocks: [],
					innerContent: [ '<p>Content</p>' ],
				},
				{ __unstableSkipMigrationLogs: true }
			);

			expect( parsedBlock.isValid ).toBe( true );
			expect( parsedBlock.validationLevel ).toBe(
				VALIDATION_LEVEL.RECONSTRUCTED_BLOCK
			);
			expect( parsedBlock.attributes.migrated ).toBe( false );
		} );
	} );

	describe( 'Validation Levels - Level 2: ReconstructedBlock', () => {
		it( 'should validate when class names generated from attributes are missing', () => {
			registerBlockType( 'core/heading', {
				...defaultBlockSettings,
				attributes: {
					level: { type: 'number', default: 2 },
					textColor: { type: 'string' },
				},
				save: ( { attributes } ) =>
					createElement(
						`h${ attributes.level }`,
						{
							className: attributes.textColor
								? `has-${ attributes.textColor }-color has-text-color`
								: undefined,
						},
						'Testing Header'
					),
			} );

			const [ isValid, issues, metadata ] = validateBlock( {
				name: 'core/heading',
				attributes: { level: 6, textColor: 'pale-pink' },
				originalContent: '<h6>Testing Header</h6>',
			} );

			expect( isValid ).toBe( true );
			// The issues found by the strict comparison explain the rewrite.
			expect( issues.length ).toBeGreaterThan( 0 );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.RECONSTRUCTED_BLOCK
			);
		} );

		it( 'should validate when attribute values change without dropping any', () => {
			registerBlockType( 'core/paragraph', {
				...defaultBlockSettings,
				attributes: {
					content: { type: 'string' },
					textColor: { type: 'string' },
				},
				save: ( { attributes } ) =>
					createElement(
						'p',
						{
							className: attributes.textColor
								? `has-${ attributes.textColor }-color has-text-color`
								: undefined,
							'data-color': attributes.textColor,
						},
						attributes.content
					),
			} );

			// The generated markup keeps every stored class name and
			// attribute, and only changes the value of `data-color`.
			const [ isValid, , metadata ] = validateBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Hello World', textColor: 'red' },
				originalContent:
					'<p class="has-red-color" data-color="blue">Hello World</p>',
			} );

			expect( isValid ).toBe( true );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.RECONSTRUCTED_BLOCK
			);
		} );

		it( 'should regenerate rather than reconstruct when a stored class name would be dropped', () => {
			registerBlockType( 'core/paragraph', {
				...defaultBlockSettings,
				attributes: {
					content: { type: 'string' },
					textColor: { type: 'string' },
				},
				save: ( { attributes } ) =>
					createElement(
						'p',
						{
							className: attributes.textColor
								? `has-${ attributes.textColor }-color has-text-color`
								: undefined,
						},
						attributes.content
					),
			} );

			// `has-blue-color` is not part of the generated markup: the text
			// is preserved, but the block is not a pure reconstruction.
			const [ isValid, , metadata ] = validateBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Hello World', textColor: 'red' },
				originalContent: '<p class="has-blue-color">Hello World</p>',
			} );

			expect( isValid ).toBe( true );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.REGENERATED_BLOCK
			);
		} );

		it( 'should regenerate rather than reconstruct when an unmodelled attribute would be dropped', () => {
			registerBlockType( 'core/paragraph', {
				...defaultBlockSettings,
				attributes: {
					content: { type: 'string' },
				},
				save: ( { attributes } ) =>
					createElement( 'p', null, attributes.content ),
			} );

			const [ isValid, , metadata ] = validateBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Hello World' },
				originalContent: '<p style="color:red">Hello World</p>',
			} );

			expect( isValid ).toBe( true );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.REGENERATED_BLOCK
			);
		} );

		it( 'should not classify extra elements following an attribute difference as attribute-only', () => {
			registerBlockType( 'core/paragraph', {
				...defaultBlockSettings,
				attributes: {
					content: { type: 'string' },
				},
				save: ( { attributes } ) =>
					createElement(
						'p',
						{ className: 'x' },
						attributes.content
					),
			} );

			// The first mismatch is an attribute, but the trailing paragraph
			// would be lost: this is not a Level 2 reconstruction.
			const [ isValid, , metadata ] = validateBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Text' },
				originalContent: '<p>Text</p><p>Extra</p>',
			} );

			expect( isValid ).toBe( false );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.INVALID_BLOCK
			);
		} );

		it( 'should not reconstruct when the block type opts out', () => {
			registerBlockType( 'core/strict-block', {
				...defaultBlockSettings,
				allowsReconstruction: false,
				attributes: {
					content: { type: 'string' },
				},
				save: ( { attributes } ) =>
					createElement(
						'p',
						{ className: 'x' },
						attributes.content
					),
			} );

			const [ isValid, issues, metadata ] = validateBlock( {
				name: 'core/strict-block',
				attributes: { content: 'Text' },
				originalContent: '<p>Text</p>',
			} );

			expect( isValid ).toBe( false );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.INVALID_BLOCK
			);
			expect( issues.length ).toBeGreaterThan( 0 );
		} );

		it( 'should be assigned by the parser when no deprecation matches', () => {
			registerBlockType( 'core/paragraph', {
				...defaultBlockSettings,
				attributes: {
					content: { type: 'string', source: 'html', selector: 'p' },
					textColor: { type: 'string' },
				},
				save: ( { attributes } ) =>
					createElement(
						'p',
						{
							className: attributes.textColor
								? `has-${ attributes.textColor }-color has-text-color`
								: undefined,
						},
						attributes.content
					),
			} );

			const parsedBlock = parseRawBlock( {
				blockName: 'core/paragraph',
				attrs: { textColor: 'vivid-red' },
				innerHTML: '<p>Paragraph missing color classes</p>',
				innerBlocks: [],
				innerContent: [ '<p>Paragraph missing color classes</p>' ],
			} );

			expect( parsedBlock.isValid ).toBe( true );
			expect( parsedBlock.validationLevel ).toBe(
				VALIDATION_LEVEL.RECONSTRUCTED_BLOCK
			);
			expect( parsedBlock.__unstableBlockSource ).toBeUndefined();

			// The reconstruction is reported in a console group, together
			// with the issues found by the strict comparison.
			expect( console ).toHaveLoggedWith(
				'Updated Block: %s (%s)',
				'core/paragraph',
				'ReconstructedBlock'
			);
			expect( console ).toHaveInformed();
			expect( console ).toHaveWarned();
		} );
	} );

	describe( 'Validation Levels - Level 3: RegeneratedBlock', () => {
		it( 'should regenerate when the HTML tag differs from attributes', () => {
			registerBlockType( 'core/heading', {
				...defaultBlockSettings,
				attributes: {
					content: { type: 'string' },
					level: { type: 'number', default: 2 },
				},
				save: ( { attributes } ) =>
					createElement(
						`h${ attributes.level }`,
						null,
						attributes.content
					),
			} );

			// Attributes say level 3 (h3), but the HTML has an h2. The text
			// is preserved, so the block is regenerated from attributes.
			const [ isValid, issues, metadata ] = validateBlock( {
				name: 'core/heading',
				attributes: { content: 'Testing Header', level: 3 },
				originalContent: '<h2>Testing Header</h2>',
			} );

			expect( isValid ).toBe( true );
			expect( issues.length ).toBeGreaterThan( 0 );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.REGENERATED_BLOCK
			);
		} );

		it( 'should regenerate malformed markup', () => {
			registerBlockType( 'core/paragraph', {
				...defaultBlockSettings,
				attributes: {
					content: { type: 'string' },
				},
				save: ( { attributes } ) =>
					createElement( 'p', null, attributes.content ),
			} );

			const [ isValid, , metadata ] = validateBlock( {
				name: 'core/paragraph',
				attributes: { content: 'invalid paragraph' },
				originalContent: '<p>invalid paragraph',
			} );

			expect( isValid ).toBe( true );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.REGENERATED_BLOCK
			);
		} );

		it( 'should regenerate markup which cannot be tokenized when its text is preserved', () => {
			registerBlockType( 'core/paragraph', {
				...defaultBlockSettings,
				attributes: {
					content: { type: 'string' },
				},
				save: ( { attributes } ) =>
					createElement(
						'p',
						null,
						createElement( RawHTML, null, attributes.content )
					),
			} );

			const [ isValid, , metadata ] = validateBlock( {
				name: 'core/paragraph',
				attributes: { content: 'aaaa <img src="">1' },
				originalContent:
					'<p>aaaa <img src onerror=alert(1)></x dde></x>1',
			} );

			expect( isValid ).toBe( true );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.REGENERATED_BLOCK
			);
		} );

		it( 'should regenerate when the generated markup adds content', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				attributes: {
					content: { type: 'string' },
				},
				save: ( { attributes } ) =>
					createElement(
						'div',
						null,
						createElement( 'p', null, attributes.content ),
						createElement( 'p', null, 'Read more' )
					),
			} );

			const [ isValid, , metadata ] = validateBlock( {
				name: 'core/test-block',
				attributes: { content: 'Intro' },
				originalContent: '<p>Intro</p>',
			} );

			expect( isValid ).toBe( true );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.REGENERATED_BLOCK
			);
		} );

		it( 'should NOT regenerate when allowsReconstruction is false', () => {
			registerBlockType( 'core/heading', {
				...defaultBlockSettings,
				allowsReconstruction: false,
				attributes: {
					content: { type: 'string' },
					level: { type: 'number', default: 2 },
				},
				save: ( { attributes } ) =>
					createElement(
						`h${ attributes.level }`,
						null,
						attributes.content
					),
			} );

			const [ isValid, issues, metadata ] = validateBlock( {
				name: 'core/heading',
				attributes: { content: 'Testing Header', level: 3 },
				originalContent: '<h2>Testing Header</h2>',
			} );

			expect( isValid ).toBe( false );
			expect( issues.length ).toBeGreaterThan( 0 );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.INVALID_BLOCK
			);
		} );

		it( 'should be assigned by the parser when no deprecation matches', () => {
			registerBlockType( 'core/heading', {
				...defaultBlockSettings,
				attributes: {
					content: {
						type: 'string',
						source: 'html',
						selector: 'h1,h2,h3,h4,h5,h6',
					},
					level: { type: 'number', default: 2 },
				},
				save: ( { attributes } ) =>
					createElement(
						`h${ attributes.level }`,
						null,
						attributes.content
					),
			} );

			const parsedBlock = parseRawBlock( {
				blockName: 'core/heading',
				attrs: { level: 3 },
				innerHTML: '<h2>Should be h3 tag</h2>',
				innerBlocks: [],
				innerContent: [ '<h2>Should be h3 tag</h2>' ],
			} );

			expect( parsedBlock.isValid ).toBe( true );
			expect( parsedBlock.validationLevel ).toBe(
				VALIDATION_LEVEL.REGENERATED_BLOCK
			);
			expect( parsedBlock.attributes.content ).toBe( 'Should be h3 tag' );
			expect( parsedBlock.__unstableBlockSource ).toBeUndefined();

			// The regeneration is reported in a console group, together with
			// the issues found by the strict comparison.
			expect( console ).toHaveLoggedWith(
				'Updated Block: %s (%s)',
				'core/heading',
				'RegeneratedBlock'
			);
			expect( console ).toHaveInformed();
			expect( console ).toHaveWarned();
		} );

		it( 'should not regenerate when media would be dropped', () => {
			registerBlockType( 'core/image', {
				...defaultBlockSettings,
				attributes: {
					url: {
						type: 'string',
						source: 'attribute',
						selector: 'img',
						attribute: 'src',
					},
				},
				save: ( { attributes } ) =>
					createElement(
						'figure',
						{ className: 'wp-block-image' },
						createElement( 'img', { src: attributes.url } )
					),
			} );

			// There is no text, but the second image is content too.
			const parsedBlock = parseRawBlock( {
				blockName: 'core/image',
				attrs: {},
				innerHTML:
					'<figure class="wp-block-image"><img src="a.png"/><img src="b.png"/></figure>',
				innerBlocks: [],
				innerContent: [
					'<figure class="wp-block-image"><img src="a.png"/><img src="b.png"/></figure>',
				],
			} );

			expect( parsedBlock.isValid ).toBe( false );
			expect( parsedBlock.validationLevel ).toBe(
				VALIDATION_LEVEL.INVALID_BLOCK
			);
			expect( parsedBlock.__unstableBlockSource ).toBeDefined();
			expect( console ).toHaveWarned();
			expect( console ).toHaveErrored();
		} );
	} );

	describe( 'Validation Levels - Level 4: InvalidBlock', () => {
		it( 'should invalidate when block type is not registered (direct API call)', () => {
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

		it( 'should invalidate when save function throws error', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				save: () => {
					throw new Error( 'Save error' );
				},
			} );

			const [ isValid, issues, metadata ] = validateBlock( {
				name: 'core/test-block',
				attributes: {},
				originalContent: 'Content',
			} );

			expect( isValid ).toBe( false );
			expect( issues.length ).toBeGreaterThan( 0 );
			expect( metadata ).toEqual( {
				validationLevel: VALIDATION_LEVEL.INVALID_BLOCK,
				originalContent: 'Content',
				generatedContent: undefined,
			} );
		} );

		it( 'should invalidate when regenerating would replace text', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				attributes: {
					content: { type: 'string' },
				},
				save: ( { attributes } ) => attributes.content,
			} );

			// The attributes disagree with the stored text. Regenerating from
			// attributes would discard what is in the post, so the block is
			// invalid and the user gets to resolve it.
			const [ isValid, issues, metadata ] = validateBlock( {
				name: 'core/test-block',
				attributes: { content: 'Server rendered' },
				originalContent: 'Client rendered',
			} );

			expect( isValid ).toBe( false );
			expect( issues.length ).toBeGreaterThan( 0 );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.INVALID_BLOCK
			);
		} );

		it( 'should invalidate when regenerating would drop text', () => {
			registerBlockType( 'core/heading', {
				...defaultBlockSettings,
				attributes: {
					content: { type: 'string' },
				},
				save: ( { attributes } ) =>
					createElement(
						'h2',
						{ className: 'wp-block-heading' },
						attributes.content
					),
			} );

			// Trailing content is not captured by the attributes.
			const [ isValid, , metadata ] = validateBlock( {
				name: 'core/heading',
				attributes: { content: 'Title' },
				originalContent:
					'<h2>Title</h2><p>This content would be lost during regeneration.</p>',
			} );

			expect( isValid ).toBe( false );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.INVALID_BLOCK
			);
		} );

		it( 'should invalidate when the content could not be sourced from the markup', () => {
			registerBlockType( 'core/heading', {
				...defaultBlockSettings,
				attributes: {
					content: {
						type: 'string',
						source: 'html',
						selector: 'h1,h2,h3,h4,h5,h6',
					},
				},
				save: ( { attributes } ) =>
					createElement(
						'h2',
						{ className: 'wp-block-heading' },
						attributes.content
					),
			} );

			// The heading selector finds nothing in a paragraph, so `save`
			// generates an empty heading: regenerating would lose the text.
			const parsedBlock = parseRawBlock( {
				blockName: 'core/heading',
				attrs: {},
				innerHTML: '<p class="wp-block-heading">Some content</p>',
				innerBlocks: [],
				innerContent: [
					'<p class="wp-block-heading">Some content</p>',
				],
			} );

			// Invalid blocks report their validation issues.
			expect( console ).toHaveWarned();
			expect( console ).toHaveErrored();
			expect( parsedBlock.isValid ).toBe( false );
			expect( parsedBlock.validationLevel ).toBe(
				VALIDATION_LEVEL.INVALID_BLOCK
			);
			expect( parsedBlock.__unstableBlockSource ).toBeDefined();
		} );

		it( 'should invalidate when allowsReconstruction is false and content differs', () => {
			registerBlockType( 'core/strict-block', {
				...defaultBlockSettings,
				allowsReconstruction: false,
				attributes: {
					content: { type: 'string' },
				},
				save: ( { attributes } ) =>
					createElement( 'p', null, attributes.content ),
			} );

			const [ isValid, issues, metadata ] = validateBlock( {
				name: 'core/strict-block',
				attributes: { content: 'Expected content' },
				originalContent: '<div>Expected content</div>',
			} );

			expect( isValid ).toBe( false );
			expect( metadata.validationLevel ).toBe(
				VALIDATION_LEVEL.INVALID_BLOCK
			);
			expect( issues.length ).toBeGreaterThan( 0 );
		} );
	} );

	describe( 'Backward Compatibility', () => {
		it( 'should return a tuple with metadata as third element', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			const result = validateBlock( {
				name: 'core/test-block',
				attributes: { fruit: 'Bananas' },
				originalContent: 'Bananas',
			} );

			expect( Array.isArray( result ) ).toBe( true );
			expect( result ).toHaveLength( 3 );
			expect( typeof result[ 0 ] ).toBe( 'boolean' );
			expect( Array.isArray( result[ 1 ] ) ).toBe( true );
			expect( result[ 2 ].validationLevel ).toBeDefined();
		} );

		it( 'should support destructuring with the legacy pattern', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			const [ isValid, issues ] = validateBlock( {
				name: 'core/test-block',
				attributes: { fruit: 'Bananas' },
				originalContent: 'Bananas',
			} );

			expect( isValid ).toBe( true );
			expect( issues ).toEqual( [] );
		} );

		it( 'should return false for invalid blocks', () => {
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
