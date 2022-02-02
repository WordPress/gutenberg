/**
 * External dependencies
 */
import {
	getEditorHtml,
	initializeEditor,
	fireEvent,
	waitFor,
	within,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';
import { Platform } from '@wordpress/element';

const GALLERY_WITH_ONE_IMAGE = `<!-- wp:gallery {"linkTo":"none"} -->
<figure class="wp-block-gallery has-nested-images columns-default is-cropped"><!-- wp:image {"id":1} -->
<figure class="wp-block-image"><img src="https://cldup.com/cXyG__fTLN.jpg" alt="" class="wp-image-1"/></figure>
<!-- /wp:image --></figure>
<!-- /wp:gallery -->`;

const addGalleryBlock = async () => {
	const screen = initializeEditor();
	const { getByA11yLabel, getByTestId, getByText } = screen;

	fireEvent.press( getByA11yLabel( 'Add block' ) );

	const blockList = getByTestId( 'InserterUI-Blocks' );
	// onScroll event used to force the FlatList to render all items
	fireEvent.scroll( blockList, {
		nativeEvent: {
			contentOffset: { y: 0, x: 0 },
			contentSize: { width: 100, height: 100 },
			layoutMeasurement: { width: 100, height: 100 },
		},
	} );

	fireEvent.press( await waitFor( () => getByText( 'Gallery' ) ) );

	return screen;
};

const initializeWithGalleryBlock = async ( initialHtml ) => {
	const screen = initializeEditor( { initialHtml } );
	const { getByA11yLabel } = screen;

	const galleryBlock = getByA11yLabel( /Gallery Block\. Row 1/ );

	const innerBlockListWrapper = await waitFor( () =>
		within( galleryBlock ).getByTestId( 'block-list-wrapper' )
	);
	fireEvent( innerBlockListWrapper, 'layout', {
		nativeEvent: {
			layout: {
				width: 100,
			},
		},
	} );

	return { ...screen, galleryBlock };
};

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

describe( 'Gallery block', () => {
	it( 'inserts block', async () => {
		const { getByA11yLabel } = await addGalleryBlock();

		const galleryBlock = await waitFor( () =>
			getByA11yLabel( /Gallery Block\. Row 1/ )
		);

		expect( galleryBlock ).toBeVisible();
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'selects a gallery item', async () => {
		const { galleryBlock } = await initializeWithGalleryBlock(
			GALLERY_WITH_ONE_IMAGE
		);

		fireEvent.press( galleryBlock );

		const galleryItem = await waitFor( () =>
			within( galleryBlock ).getByA11yLabel( /Image Block\. Row 1/ )
		);
		fireEvent.press( galleryItem );

		expect( galleryItem ).toBeVisible();
	} );

	it( 'shows appender button when gallery has images', async () => {
		const { galleryBlock, getByText } = await initializeWithGalleryBlock(
			GALLERY_WITH_ONE_IMAGE
		);

		fireEvent.press( galleryBlock );

		const appenderButton = await waitFor( () =>
			within( galleryBlock ).getByA11yLabel( /Gallery block\. Empty/ )
		);
		fireEvent.press( appenderButton );

		expect( getByText( 'Choose from device' ) ).toBeDefined();
		expect( getByText( 'Take a Photo' ) ).toBeDefined();
		expect( getByText( 'WordPress Media Library' ) ).toBeDefined();
	} );

	// This case is disabled until the issue (https://github.com/WordPress/gutenberg/issues/38444)
	// is addressed.
	it.skip( 'displays media options picker when selecting the block', () => {
		// Initialize with an empty gallery
		const { getByA11yLabel, getByText, getByTestId } = initializeEditor( {
			initialHtml: `<!-- wp:gallery {"linkTo":"none"} -->
		<figure class="wp-block-gallery has-nested-images columns-default is-cropped"></figure>
		<!-- /wp:gallery -->`,
		} );

		// Tap on Gallery block
		fireEvent.press( getByText( 'ADD MEDIA' ) );

		// Observe that media options picker is displayed
		expect( getByText( 'Choose images' ) ).toBeDefined();
		expect( getByText( 'WordPress Media Library' ) ).toBeDefined();

		// Dimiss the picker
		if ( Platform.isIOS ) {
			fireEvent.press( getByText( 'Cancel' ) );
		} else {
			const mediaPicker = getByTestId( 'media-options-picker' );
			fireEvent( mediaPicker, 'backdropPress' );
		}

		// Observe that the block is selected, this is done by checking if the block settings
		// button is visible
		const blockActionsButton = getByA11yLabel( /Open Block Actions Menu/ );
		expect( blockActionsButton ).toBeVisible();
	} );
} );
