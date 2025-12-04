/**
 * WordPress dependencies
 */
import { serialize } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import transforms from '../transforms';

describe( 'gallery transforms', () => {
	beforeAll( () => {
		registerCoreBlocks();
	} );

	describe( 'shortcode transform', () => {
		it( 'should transform gallery shortcode with ids', () => {
			const shortcodeTransform = transforms.from.find(
				( transform ) =>
					transform.type === 'shortcode' &&
					transform.tag === 'gallery'
			);

			expect( shortcodeTransform ).toBeDefined();

			const block = shortcodeTransform.transform( {
				named: { ids: '1,2,3', columns: '3', size: 'medium' },
			} );

			expect( block.name ).toBe( 'core/gallery' );
			expect( block.attributes.columns ).toBe( 3 );
			expect( block.attributes.sizeSlug ).toBe( 'medium' );
			expect( block.innerBlocks ).toHaveLength( 3 );
		} );

		it( 'should set initFromId on inner image blocks', () => {
			const shortcodeTransform = transforms.from.find(
				( transform ) =>
					transform.type === 'shortcode' &&
					transform.tag === 'gallery'
			);

			const block = shortcodeTransform.transform( {
				named: { ids: '1,2,3', columns: '3' },
			} );

			// Each inner image block should have initFromId set to true
			block.innerBlocks.forEach( ( innerBlock, index ) => {
				expect( innerBlock.name ).toBe( 'core/image' );
				expect( innerBlock.attributes.id ).toBe( index + 1 );
				expect( innerBlock.attributes.initFromId ).toBe( true );
			} );
		} );

		it( 'should pass sizeSlug to inner image blocks', () => {
			const shortcodeTransform = transforms.from.find(
				( transform ) =>
					transform.type === 'shortcode' &&
					transform.tag === 'gallery'
			);

			const block = shortcodeTransform.transform( {
				named: { ids: '1,2', columns: '2', size: 'thumbnail' },
			} );

			block.innerBlocks.forEach( ( innerBlock ) => {
				expect( innerBlock.attributes.sizeSlug ).toBe( 'thumbnail' );
			} );
		} );

		it( 'should not serialize initFromId attribute', () => {
			const shortcodeTransform = transforms.from.find(
				( transform ) =>
					transform.type === 'shortcode' &&
					transform.tag === 'gallery'
			);

			const block = shortcodeTransform.transform( {
				named: { ids: '1', columns: '1' },
			} );

			// The initFromId attribute should not be serialized
			const serialized = serialize( block );
			expect( serialized ).not.toContain( 'initFromId' );
		} );
	} );
} );
