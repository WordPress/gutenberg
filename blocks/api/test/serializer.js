/**
 * External dependencies
 */
import { expect } from 'chai';
import { pick, identity } from 'lodash';

/**
 * Internal dependencies
 */
import serialize, { getCommentAttributes, getSaveContent } from '../serializer';
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
		it( 'should return empty string if no encodeAttributes implementation', () => {
			const commentAttributes = getCommentAttributes( undefined, {
				fruit: 'bananas',
			} );

			expect( commentAttributes ).to.equal( '' );
		} );

		it( 'should return joined string of `key="value"` pairs by difference subset', () => {
			const commentAttributes = getCommentAttributes(
				( attributes ) => pick( attributes, 'category', 'ripeness' ),
				{
					fruit: 'bananas',
					category: 'food',
					ripeness: 'ripe',
				}
			);

			expect( commentAttributes ).to.equal( 'category="food" ripeness="ripe"' );
		} );

		it( 'should not append an undefined attribute value', () => {
			const commentAttributes = getCommentAttributes( identity, {
				category: 'food',
				ripeness: undefined,
			} );

			expect( commentAttributes ).to.equal( 'category="food"' );
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
				encodeAttributes( attributes ) {
					const { align } = attributes;
					return { align };
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
			const expectedPostContent = '<!-- wp:core/test-block align="left" -->\n<p>Ribs & Chicken</p>\n<!-- /wp:core/test-block -->\n\n';

			expect( serialize( blockList ) ).to.eql( expectedPostContent );
		} );
	} );
} );
