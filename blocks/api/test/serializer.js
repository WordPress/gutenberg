/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import serialize, { getCommentAttributes, getSaveContent, serializeValue } from '../serializer';
import { getBlockTypes, registerBlockType, unregisterBlockType } from '../registration';

describe( 'block serializer', () => {
	afterEach( () => {
		getBlockTypes().forEach( block => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'getSaveContent()', () => {
		context( 'function save', () => {
			it( 'should return string verbatim', () => {
				const saved = getSaveContent(
					( { attributes } ) => attributes.fruit,
					{ fruit: 'Bananas' }
				);

				expect( saved ).to.equal( 'Bananas' );
			} );

			it( 'should return element as string if save returns element', () => {
				const { createElement } = wp.element;
				const saved = getSaveContent(
					( { attributes } ) => createElement( 'div', null, attributes.fruit ),
					{ fruit: 'Bananas' }
				);

				expect( saved ).to.equal( '<div>Bananas</div>' );
			} );
		} );

		context( 'component save', () => {
			it( 'should return element as string', () => {
				const { Component, createElement } = wp.element;
				const saved = getSaveContent(
					class extends Component {
						render() {
							return createElement( 'div', null, this.props.attributes.fruit );
						}
					},
					{ fruit: 'Bananas' }
				);

				expect( saved ).to.equal( '<div>Bananas</div>' );
			} );
		} );
	} );

	describe( 'getCommentAttributes()', () => {
		it( 'should return an empty set if no attributes provided', () => {
			const attributes = getCommentAttributes( {}, {} );

			expect( attributes ).to.eql( {} );
		} );

		it( 'should only return attributes which cannot be inferred from the content', () => {
			const attributes = getCommentAttributes( {
				fruit: 'bananas',
				category: 'food',
				ripeness: 'ripe',
			}, {
				fruit: 'bananas',
			} );

			expect( attributes ).to.eql( {
				category: 'food',
				ripeness: 'ripe',
			} );
		} );

		it( 'should skip attributes whose values are undefined', () => {
			const attributes = getCommentAttributes( {
				fruit: 'bananas',
				ripeness: undefined,
			}, {} );

			expect( attributes ).to.eql( { fruit: 'bananas' } );
		} );
	} );

	describe( 'serializeValue()', () => {
		it( 'should escape double-quotes', () => {
			expect( serializeValue( 'a"b' ) ).to.equal( 'a\"b' );
		} );

		it( 'should escape hyphens', () => {
			expect( serializeValue( '-' ) ).to.equal( '\u{5c}-' );
			expect( serializeValue( '--' ) ).to.equal( '\u{5c}-\u{5c}-' );
			expect( serializeValue( '\\-' ) ).to.equal( '\u{5c}\u{5c}-' );
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
						align: 'left',
					},
				},
			];
			const expectedPostContent = '<!-- wp:core/test-block align="left" -->\n<p>Ribs & Chicken</p>\n<!-- /wp:core/test-block -->';

			expect( serialize( blockList ) ).to.eql( expectedPostContent );
		} );
	} );
} );
