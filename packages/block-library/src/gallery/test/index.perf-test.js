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
		// This test fails because...
		// This returns a RNTL screen...
		const screen = await addGalleryBlock();
		// This returns a rendered view...
		const galleryBlock = getBlock( screen, 'Gallery' );
		// This expects the first argument to be a component to render, not a
		// rendered component. Also, I do not see a `screen` option documented..
		// E.g. `await measurePerformance( <GalleryBlock /> )`
		await measurePerformance( galleryBlock, { screen } );
		// There may be a way to leverage our helpers with Reassure, but they may
		// be incompatible given that Reassure wants to control rendering.
	} );
} );
