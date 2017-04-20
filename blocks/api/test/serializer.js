/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import serialize, { getCommentAttributes, getSaveContent } from '../serializer';
import { getBlocks, registerBlock, unregisterBlock } from '../registration';

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
				fruit: 'bananas',
				category: 'food',
				ripeness: 'ripe'
			}, {
				fruit: 'bananas'
			} );

			expect( attributes ).to.equal( 'category:food ripeness:ripe ' );
		} );

		it( 'should not append an undefined attribute value', () => {
			const attributes = getCommentAttributes( {
				fruit: 'bananas',
				category: 'food',
				ripeness: undefined
			}, {
				fruit: 'bananas'
			} );

			expect( attributes ).to.equal( 'category:food ' );
		} );
	} );

	describe( 'serialize()', () => {
		it( 'should serialize the post content properly', () => {
			const blockSettings = {
				attributes: ( rawContent ) => {
					return {
						content: rawContent
					};
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
			const expectedPostContent = '<!-- wp:core/test-block align:left --><p>Ribs & Chicken</p><!-- /wp:core/test-block -->';

			expect( serialize( blockList ) ).to.eql( expectedPostContent );
		} );
	} );
} );
