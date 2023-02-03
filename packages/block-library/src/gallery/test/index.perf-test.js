/**
 * External dependencies
 */
import { getBlock, setupCoreBlocks } from 'test/helpers';
import { measurePerformance } from 'reassure';

/**
 * Internal dependencies
 */
import { addGalleryBlock } from './helpers';

setupCoreBlocks();

describe( 'Gallery block', () => {
	it( 'measures performance', async () => {
		const screen = await addGalleryBlock();
		const galleryBlock = getBlock( screen, 'Gallery' );

		await measurePerformance( galleryBlock, { screen } );
	} );
} );
