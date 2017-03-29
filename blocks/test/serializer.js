/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { default as serialize } from '../serializer';
import { getBlocks, registerBlock, unregisterBlock } from '../registration';

describe( 'block serializer', () => {
	afterEach( () => {
		getBlocks().forEach( block => {
			unregisterBlock( block.slug );
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
