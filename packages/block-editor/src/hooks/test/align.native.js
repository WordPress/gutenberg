/**
 * External dependencies
 */
import {
	addBlock,
	getEditorHtml,
	initializeEditor,
	getBlock,
	fireEvent,
	within,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

const imageHTML = `<!-- wp:image {"id":1,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://test-site.files.wordpress.com/local-image-1.jpeg" alt="" class="wp-image-1"/></figure>
<!-- /wp:image -->`;

beforeAll( () => {
	// Register all core blocks
	registerCoreBlocks();
} );

afterAll( () => {
	// Clean up registered blocks
	getBlockTypes().forEach( ( block ) => {
		unregisterBlockType( block.name );
	} );
} );

describe( 'Align options', () => {
	describe( 'for media block', () => {
		[
			'None',
			'Align left',
			'Align center',
			'Align right',
			'Wide width',
			'Full width',
		].forEach( ( alignmentOption ) =>
			it( `sets ${ alignmentOption } option`, async () => {
				const screen = await initializeEditor( {
					initialHtml: imageHTML,
				} );
				const { getByLabelText } = screen;

				// Get Image block
				const imageBlock = await getBlock( screen, 'Image' );
				expect( imageBlock ).toBeVisible();
				fireEvent.press( imageBlock );

				// Open alignments menu
				const alignmentButtons = getByLabelText( 'Align' );
				fireEvent.press( alignmentButtons );

				// Select alignment option.
				fireEvent.press( await getByLabelText( alignmentOption ) );

				expect( getEditorHtml() ).toMatchSnapshot();
			} )
		);
	} );

	describe( 'for text block', () => {
		[ 'Align text left', 'Align text center', 'Align text right' ].forEach(
			( alignmentOption ) =>
				it( `sets ${ alignmentOption } option`, async () => {
					const screen = await initializeEditor();
					const { getByLabelText } = screen;

					// Add Paragraph block
					await addBlock( screen, 'Paragraph' );

					// Get Paragraph block
					const paragraphBlock = await getBlock(
						screen,
						'Paragraph'
					);
					expect( paragraphBlock ).toBeVisible();

					// Open alignments menu
					const alignmentButtons = getByLabelText( 'Align text' );
					fireEvent.press( alignmentButtons );

					// Select alignment option.
					fireEvent.press( await getByLabelText( alignmentOption ) );

					expect( getEditorHtml() ).toMatchSnapshot();
				} )
		);
	} );

	describe( 'for group block', () => {
		[ 'None', 'Wide width', 'Full width' ].forEach( ( alignmentOption ) =>
			it( `sets ${ alignmentOption } option`, async () => {
				const screen = await initializeEditor();
				const { getByLabelText } = screen;

				// Add Group block
				await addBlock( screen, 'Group' );

				// Get Paragraph block
				const groupBlock = await getBlock( screen, 'Group' );
				expect( groupBlock ).toBeVisible();

				// Trigger inner blocks layout
				const innerBlockListWrapper = await within(
					groupBlock
				).findByTestId( 'block-list-wrapper' );
				fireEvent( innerBlockListWrapper, 'layout', {
					nativeEvent: {
						layout: {
							width: 300,
						},
					},
				} );

				// Open alignments menu
				const alignmentButtons = getByLabelText( 'Align' );
				fireEvent.press( alignmentButtons );

				// Select alignment option.
				fireEvent.press( await getByLabelText( alignmentOption ) );

				expect( getEditorHtml() ).toMatchSnapshot();
			} )
		);
	} );
} );
