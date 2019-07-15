/**
 * WordPress dependencies
 */
import { createElement, Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import serialize, {
	getCommentAttributes,
	getSaveContent,
	serializeAttributes,
	getCommentDelimitedContent,
	serializeBlock,
	getBlockContent,
} from '../serializer';
import {
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
	setFreeformContentHandlerName,
	setUnregisteredTypeHandlerName,
} from '../registration';
import { createBlock } from '../';

describe( 'block serializer', () => {
	beforeAll( () => {
		// Initialize the block store.
		require( '../../store' );
	} );

	afterEach( () => {
		setFreeformContentHandlerName( undefined );
		setUnregisteredTypeHandlerName( undefined );
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'getSaveContent()', () => {
		describe( 'function save', () => {
			const fruitBlockSave = ( { attributes } ) => createElement( 'div', null, attributes.fruit );

			it( 'should return element as string if save returns element', () => {
				const saved = getSaveContent(
					{
						name: 'core/fruit',
						save: fruitBlockSave,
					},
					{ fruit: 'Bananas' }
				);

				expect( saved ).toBe( '<div>Bananas</div>' );
			} );

			it( 'should work when block type is passed as string', () => {
				registerBlockType( 'core/fruit', {
					title: 'Fruit',
					category: 'widgets',
					save: fruitBlockSave,
				} );

				const saved = getSaveContent(
					'core/fruit',
					{ fruit: 'Bananas' }
				);

				expect( saved ).toBe( '<div>Bananas</div>' );
			} );
		} );

		describe( 'component save', () => {
			it( 'should return element as string', () => {
				const saved = getSaveContent(
					{
						save: class extends Component {
							render() {
								return createElement( 'div', null, this.props.attributes.fruit );
							}
						},
						name: 'core/fruit',
					},
					{ fruit: 'Bananas' }
				);

				expect( saved ).toBe( '<div>Bananas</div>' );
			} );
		} );
	} );

	describe( 'getCommentAttributes()', () => {
		it( 'should return an empty set if no attributes provided', () => {
			const attributes = getCommentAttributes( {}, {} );

			expect( attributes ).toEqual( {} );
		} );

		it( 'should only return attributes which are not matched from content', () => {
			const attributes = getCommentAttributes(
				{
					attributes: {
						fruit: {
							type: 'string',
							source: 'text',
						},
						category: {
							type: 'string',
						},
						ripeness: {
							type: 'string',
						},
					},
				},
				{
					fruit: 'bananas',
					category: 'food',
					ripeness: 'ripe',
				}
			);

			expect( attributes ).toEqual( {
				category: 'food',
				ripeness: 'ripe',
			} );
		} );

		it( 'should skip attributes whose values are undefined', () => {
			const attributes = getCommentAttributes(
				{
					attributes: {
						fruit: {
							type: 'string',
						},
						ripeness: {
							type: 'string',
						},
					},
				},
				{
					fruit: 'bananas',
					ripeness: undefined,
				}
			);

			expect( attributes ).toEqual( { fruit: 'bananas' } );
		} );
	} );

	describe( 'serializeAttributes()', () => {
		it( 'should not break HTML comments', () => {
			expect( serializeAttributes( { a: '-- and --' } ) ).toBe( '{"a":"\\u002d\\u002d and \\u002d\\u002d"}' );
		} );

		it( 'should not break standard-non-compliant tools for "<"', () => {
			expect( serializeAttributes( { a: '< and <' } ) ).toBe( '{"a":"\\u003c and \\u003c"}' );
		} );

		it( 'should not break standard-non-compliant tools for ">"', () => {
			expect( serializeAttributes( { a: '> and >' } ) ).toBe( '{"a":"\\u003e and \\u003e"}' );
		} );

		it( 'should not break standard-non-compliant tools for "&"', () => {
			expect( serializeAttributes( { a: '& and &' } ) ).toBe( '{"a":"\\u0026 and \\u0026"}' );
		} );

		it( 'should replace quotation marks', () => {
			expect( serializeAttributes( { a: '" and "' } ) ).toBe( '{"a":"\\u0022 and \\u0022"}' );
		} );
	} );

	describe( 'getCommentDelimitedContent()', () => {
		it( 'should generate empty attributes void', () => {
			const content = getCommentDelimitedContent(
				'core/test-block',
				{},
				''
			);

			expect( content ).toBe( '<!-- wp:test-block /-->' );
		} );

		it( 'should include the namespace for non-core blocks', () => {
			const content = getCommentDelimitedContent(
				'my-wonderful-namespace/test-block',
				{},
				''
			);

			expect( content ).toBe( '<!-- wp:my-wonderful-namespace/test-block /-->' );
		} );

		it( 'should generate empty attributes non-void', () => {
			const content = getCommentDelimitedContent(
				'core/test-block',
				{},
				'Delicious'
			);

			expect( content ).toBe( '<!-- wp:test-block -->\nDelicious\n<!-- /wp:test-block -->' );
		} );

		it( 'should generate non-empty attributes void', () => {
			const content = getCommentDelimitedContent(
				'core/test-block',
				{ fruit: 'Banana' },
				''
			);

			expect( content ).toBe(
				'<!-- wp:test-block {"fruit":"Banana"} /-->'
			);
		} );

		it( 'should generate non-empty attributes non-void', () => {
			const content = getCommentDelimitedContent(
				'core/test-block',
				{ fruit: 'Banana' },
				'Delicious'
			);

			expect( content ).toBe(
				'<!-- wp:test-block {"fruit":"Banana"} -->\nDelicious\n<!-- /wp:test-block -->'
			);
		} );
	} );

	describe( 'serializeBlock()', () => {
		it( 'serializes the freeform content fallback block without comment delimiters', () => {
			registerBlockType( 'core/freeform-block', {
				category: 'common',
				title: 'freeform block',
				attributes: {
					fruit: {
						type: 'string',
					},
				},
				save: ( { attributes } ) => attributes.fruit,
			} );
			setFreeformContentHandlerName( 'core/freeform-block' );
			const block = createBlock( 'core/freeform-block', { fruit: 'Bananas' } );

			const content = serializeBlock( block );

			expect( content ).toBe( 'Bananas' );
		} );
		it( 'serializes the freeform content fallback block with comment delimiters in nested context', () => {
			registerBlockType( 'core/freeform-block', {
				category: 'common',
				title: 'freeform block',
				attributes: {
					fruit: {
						type: 'string',
					},
				},
				save: ( { attributes } ) => attributes.fruit,
			} );
			setFreeformContentHandlerName( 'core/freeform-block' );
			const block = createBlock( 'core/freeform-block', { fruit: 'Bananas' } );

			const content = serializeBlock( block, { isInnerBlocks: true } );

			expect( content ).toBe(
				'<!-- wp:freeform-block {\"fruit\":\"Bananas\"} -->\n' +
				'Bananas\n' +
				'<!-- /wp:freeform-block -->'
			);
		} );
		it( 'serializes the unregistered fallback block without comment delimiters', () => {
			registerBlockType( 'core/unregistered-block', {
				category: 'common',
				title: 'unregistered block',
				attributes: {
					fruit: {
						type: 'string',
					},
				},
				save: ( { attributes } ) => attributes.fruit,
			} );
			setUnregisteredTypeHandlerName( 'core/unregistered-block' );
			const block = createBlock( 'core/unregistered-block', { fruit: 'Bananas' } );

			const content = serializeBlock( block );

			expect( content ).toBe( 'Bananas' );
		} );
	} );

	describe( 'serialize()', () => {
		beforeEach( () => {
			const blockType = {
				attributes: {
					throw: {
						type: 'boolean',
					},
					defaulted: {
						type: 'boolean',
						default: false,
					},
					content: {
						type: 'string',
						source: 'text',
					},
					stuff: {
						type: 'string',
					},
				},
				save( { attributes } ) {
					if ( attributes.throw ) {
						throw new Error();
					}

					return (
						<p>
							{ attributes.content }
						</p>
					);
				},
				category: 'common',
				title: 'block title',
			};
			registerBlockType( 'core/test-block', blockType );
		} );

		it( 'should serialize the post content properly', () => {
			const block = createBlock( 'core/test-block', {
				content: 'Ribs & Chicken',
				stuff: 'left & right -- but <not>',
			} );
			const expectedPostContent = '<!-- wp:test-block {"stuff":"left \\u0026 right \\u002d\\u002d but \\u003cnot\\u003e"} -->\n<p>Ribs &amp; Chicken</p>\n<!-- /wp:test-block -->';

			expect( serialize( [ block ] ) ).toEqual( expectedPostContent );
			expect( serialize( block ) ).toEqual( expectedPostContent );
		} );

		it( 'should preserve content for invalid block', () => {
			const block = createBlock( 'core/test-block', {
				content: 'Incorrect',
			} );

			block.isValid = false;
			block.originalContent = 'Correct';

			expect( serialize( block ) ).toEqual(
				'<!-- wp:test-block -->\nCorrect\n<!-- /wp:test-block -->'
			);
		} );

		it( 'should preserve content for crashing block', () => {
			const block = createBlock( 'core/test-block', {
				content: 'Incorrect',
				throw: true,
			} );

			block.originalContent = 'Correct';

			expect( serialize( block ) ).toEqual(
				'<!-- wp:test-block {"throw":true} -->\nCorrect\n<!-- /wp:test-block -->'
			);
		} );
	} );

	describe( 'getBlockContent', () => {
		it( "should return the block's serialized inner HTML", () => {
			const blockType = {
				attributes: {
					content: {
						type: 'string',
						source: 'text',
					},
				},
				save( { attributes } ) {
					return attributes.content;
				},
				category: 'common',
				title: 'block title',
			};
			registerBlockType( 'core/chicken', blockType );
			const block =	{
				name: 'core/chicken',
				attributes: {
					content: 'chicken',
				},
				isValid: true,
			};
			expect( getBlockContent( block ) ).toBe( 'chicken' );
		} );
	} );
} );
