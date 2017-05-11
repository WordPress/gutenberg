/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import serialize, { getCommentAttributes, getSaveContent } from '../serializer';
import { getBlocks, registerBlock, unregisterBlock } from '../registration';
import query from '../query';

describe( 'block serializer', () => {
	afterEach( () => {
		getBlocks().forEach( block => {
			unregisterBlock( block.slug );
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
		it( 'should return empty string if no difference', () => {
			const attributes = getCommentAttributes( {}, {} );

			expect( attributes ).to.equal( '' );
		} );

		it( 'should return joined string of key:value pairs by difference subset', () => {
			const attributes = getCommentAttributes( {
				attributes: {
					category: { source: 'metadata', name: 'cat' },
					ripeness: { source: 'metadata', name: 'ripeness' },
				}
			}, {
				fruit: 'bananas',
				category: 'food',
				ripeness: 'ripe'
			} );

			expect( attributes ).to.equal( 'cat="food" ripeness="ripe" ' );
		} );

		it( 'should not append an undefined attribute value', () => {
			const attributes = getCommentAttributes( {
				attributes: {
					category: { source: 'metadata', name: 'cat' },
					ripeness: { source: 'metadata', name: 'ripeness' },
				}
			}, {
				fruit: 'bananas',
				category: 'food',
				ripeness: undefined
			} );

			expect( attributes ).to.equal( 'cat="food" ' );
		} );
	} );

	describe( 'serialize()', () => {
		it( 'should serialize the post content properly', () => {
			const blockSettings = {
				attributes: {
					align: query.metadata( 'align' )
				},
				save( { attributes } ) {
					return <p dangerouslySetInnerHTML={ { __html: attributes.content } } />;
				}
			};
			registerBlock( 'core/test-block', blockSettings );
			const blockList = [
				{
					blockType: 'core/test-block',
					attributes: {
						content: 'Ribs & Chicken',
						align: 'left'
					}
				}
			];
			const expectedPostContent = '<!-- wp:core/test-block align="left" -->\n<p>Ribs & Chicken</p>\n<!-- /wp:core/test-block -->\n\n';

			expect( serialize( blockList ) ).to.eql( expectedPostContent );
		} );
	} );
} );
