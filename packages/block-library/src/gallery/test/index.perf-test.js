/**
 * External dependencies
 */
import { measurePerformance } from 'reassure';
import { getBlock, setupCoreBlocks } from 'test/helpers';

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
