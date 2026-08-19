import { screen } from '@testing-library/react';
import { createBlock } from '@wordpress/blocks';
import {
	initializeEditor,
	selectBlock,
} from '@wordpress/integration-tests/helpers/integration-test-editor';
import { registerCoreBlocks } from '@wordpress/block-library';

const IMAGE_ATTRIBUTES = {
	id: 1,
	url: 'https://example.com/image.jpg',
	alt: 'Example image',
};

/**
 * Registers the core blocks up front so inner blocks can be created before the
 * editor is initialized, then renders the given block.
 *
 * @param {Object} block Block to render, created with `createBlock`.
 */
async function setup( block ) {
	return initializeEditor( block, false );
}

describe( 'Gallery block', () => {
	beforeEach( () => {
		registerCoreBlocks();
	} );

	describe( 'Block toolbar', () => {
		test( 'does not offer alignment for an image inside a gallery', async () => {
			await setup(
				createBlock( 'core/gallery', {}, [
					createBlock( 'core/image', IMAGE_ATTRIBUTES ),
				] )
			);

			await selectBlock( 'Block: Image' );

			// The gallery lays its images out with the flex layout, which
			// permits no alignments, so the child image must not offer them.
			expect(
				screen.queryByRole( 'button', { name: 'Align block' } )
			).not.toBeInTheDocument();
		} );

		test( 'offers alignment for an image outside a gallery', async () => {
			await setup( createBlock( 'core/image', IMAGE_ATTRIBUTES ) );

			await selectBlock( 'Block: Image' );

			expect(
				screen.getByRole( 'button', { name: 'Align block' } )
			).toBeInTheDocument();
		} );
	} );
} );
