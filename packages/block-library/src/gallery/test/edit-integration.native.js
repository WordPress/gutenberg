/**
 * External dependencies
 */
 import {
	initializeEditor,
	fireEvent,
	getEditorHtml,
	waitFor,
	within,
} from 'test/helpers';
import { Image } from 'react-native';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';
import {
	BlockCaption,
} from '@wordpress/block-editor';

const getSizeSpy = jest.spyOn( Image, 'getSize' );

beforeAll( () => {
	// Register all core blocks
	registerCoreBlocks();

	getSizeSpy.mockImplementation( ( _url, callback ) => callback( 300, 200 ) );
} );

afterAll( () => {
	// Clean up registered blocks
	getBlockTypes().forEach( ( block ) => {
		unregisterBlockType( block.name );

		getSizeSpy.mockRestore();
	} );
} );

describe( 'when a gallery block is shown', () => {
	it( 'does not crash when adding caption to gallery block', async () => {
		const initialHtml = `<!-- wp:gallery {"columns":2,"className":"alignfull"} --><figure class="wp-block-gallery columns-2 is-cropped alignfull"><ul class="blocks-gallery-grid"><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon.png" alt=""/><figcaption class="blocks-gallery-item__caption">Paragraph</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Heading.png" alt=""/><figcaption class="blocks-gallery-item__caption">Heading</figcaption></figure></li></ul></figure><!-- /wp:gallery -->`;
		const { getByA11yLabel, getByTestId } = await initializeEditor( {
			initialHtml,
		} );
		const captionInput = await waitFor( () =>
			getByA11yLabel( /Gallery caption\. Empty/ )
		);

		captionInput.children[0].children[0].simulate('changeText', 'This is a caption on a gallery block.');

		// fireEvent.changeText( captionInput.children[0].children[0].children[0].children[0].children[0].children[0], 'This is a caption on a gallery block.' );

		const expectedHtml = `<!-- wp:gallery {"ids":[],"columns":2,"linkTo":"none","className":"alignfull"} --><figure class="wp-block-gallery columns-2 is-cropped alignfull"><ul class="blocks-gallery-grid"><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon.png" alt=""/><figcaption class="blocks-gallery-item__caption">Paragraph</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Heading.png" alt=""/><figcaption class="blocks-gallery-item__caption">Heading</figcaption></figure></li></ul><figcaption class="blocks-gallery-caption">This is a caption on a gallery block.</figcaption></figure><!-- /wp:gallery -->`;
		expect( getEditorHtml() ).toBe( expectedHtml );
	} );
} );