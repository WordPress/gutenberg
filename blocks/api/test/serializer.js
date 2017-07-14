/**
 * WordPress dependencies
 */
import { createElement, Component } from 'element';

/**
 * Internal dependencies
 */
import serialize, { getCommentAttributes, getSaveContent, serializeAttributes } from '../serializer';
import { getBlockTypes, registerBlockType, unregisterBlockType } from '../registration';

describe( 'block serializer', () => {
	afterEach( () => {
		getBlockTypes().forEach( block => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'getSaveContent()', () => {
		describe( 'function save', () => {
			it( 'should return string verbatim', () => {
				const saved = getSaveContent(
					{
						save: ( { attributes } ) => attributes.fruit,
						name: 'core/fruit',
					},
					{ fruit: 'Bananas' }
				);

				expect( saved ).toBe( 'Bananas' );
			} );

			it( 'should return element as string if save returns element', () => {
				const saved = getSaveContent(
					{
						save: ( { attributes } ) => createElement( 'div', null, attributes.fruit ),
						name: 'core/fruit',
					},
					{ fruit: 'Bananas' }
				);

				expect( saved ).toBe( '<div class="wp-block-fruit">Bananas</div>' );
			} );

			it( 'should use the namespace in the classname for non-core blocks', () => {
				const saved = getSaveContent(
					{
						save: ( { attributes } ) => createElement( 'div', null, attributes.fruit ),
						name: 'myplugin/fruit',
					},
					{ fruit: 'Bananas' }
				);

				expect( saved ).toBe( '<div class="wp-block-myplugin-fruit">Bananas</div>' );
			} );

			it( 'should allow overriding the className', () => {
				const saved = getSaveContent(
					{
						save: ( { attributes } ) => createElement( 'div', null, attributes.fruit ),
						name: 'myplugin/fruit',
						className: 'apples',
					},
					{ fruit: 'Bananas' }
				);

				expect( saved ).toBe( '<div class="apples">Bananas</div>' );
			} );

			it( 'should include additional classes in block attributes', () => {
				const saved = getSaveContent(
					{
						save: ( { attributes } ) => createElement( 'div', {
							className: 'fruit',
						}, attributes.fruit ),
						name: 'myplugin/fruit',
						className: 'apples',
					},
					{
						fruit: 'Bananas',
						className: 'fresh',
					}
				);

				expect( saved ).toBe( '<div class="apples fruit fresh">Bananas</div>' );
			} );

			it( 'should not add a className if falsy', () => {
				const saved = getSaveContent(
					{
						save: ( { attributes } ) => createElement( 'div', null, attributes.fruit ),
						name: 'myplugin/fruit',
						className: false,
					},
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

		it( 'should only return attributes which cannot be inferred from the content', () => {
			const attributes = getCommentAttributes( {
				fruit: 'bananas',
				category: 'food',
				ripeness: 'ripe',
			}, {
				fruit: 'bananas',
			} );

			expect( attributes ).toEqual( {
				category: 'food',
				ripeness: 'ripe',
			} );
		} );

		it( 'should skip attributes whose values are undefined', () => {
			const attributes = getCommentAttributes( {
				fruit: 'bananas',
				ripeness: undefined,
			}, {} );

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
	} );

	describe( 'serialize()', () => {
		it( 'should serialize the post content properly', () => {
			const blockType = {
				attributes: ( rawContent ) => {
					return {
						content: rawContent,
					};
				},
				save( { attributes } ) {
					return <p dangerouslySetInnerHTML={ { __html: attributes.content } } />;
				},
			};
			registerBlockType( 'core/test-block', blockType );
			const blockList = [
				{
					name: 'core/test-block',
					attributes: {
						content: 'Ribs & Chicken',
						stuff: 'left & right -- but <not>',
					},
				},
			];
			const expectedPostContent = '<!-- wp:core/test-block {"stuff":"left \\u0026 right \\u002d\\u002d but \\u003cnot\\u003e"} -->\n<p class="wp-block-test-block">Ribs & Chicken</p>\n<!-- /wp:core/test-block -->';

			expect( serialize( blockList ) ).toEqual( expectedPostContent );
		} );
	} );
} );
