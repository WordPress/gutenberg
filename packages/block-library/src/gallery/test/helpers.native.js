/**
 * External dependencies
 */
import {
	addBlock,
	fireEvent,
	getBlock,
	getInnerBlock,
	initializeEditor,
	triggerBlockListLayout,
} from 'test/helpers';

/**
 * Adds a Gallery block via the block picker.
 *
 * @return {import('@testing-library/react-native').RenderAPI} A Testing Library screen.
 */
export const addGalleryBlock = async () => {
	const screen = await initializeEditor();
	await addBlock( screen, 'Gallery' );
	return screen;
};

/**
 * Initialize the editor with HTML generated of Gallery block.
 *
 * @param {Object}  [options]               Configuration options for the initialization.
 * @param {string}  [options.html]          String of block editor HTML to parse and render.
 * @param {number}  [options.numberOfItems] Number of gallery items to generate or already included in the provided block editor HTML.
 * @param {Object}  [options.media]         Contains media data to be used in the generation.
 * @param {number}  [options.width]         Width to be passed when triggering the "onLayout" event on the Gallery block.
 * @param {boolean} [options.selected]      Specifies if the Gallery block included in the initial HTML should be automatically selected.
 * @param {boolean} [options.useLocalUrl]   Specifies if the items should use the local URL instead of the server URL.
 *
 * @return {import('@testing-library/react-native').RenderAPI} The Testing Library screen plus the Gallery block React Test instance.
 */
export const initializeWithGalleryBlock = async ( {
	html,
	numberOfItems = 0,
	media = [],
	width = 320,
	selected = true,
	useLocalUrl = false,
} = {} ) => {
	const initialHtml =
		html ||
		generateGalleryBlock( numberOfItems, media, {
			useLocalUrl,
		} );
	const screen = await initializeEditor( { initialHtml } );

	const galleryBlock = getBlock( screen, 'Gallery' );

	if ( numberOfItems > 0 ) {
		await triggerBlockListLayout( galleryBlock, { width } );
	}

	if ( selected ) {
		fireEvent.press( galleryBlock );
	}

	return { ...screen, galleryBlock };
};

/**
 * Gets a gallery item within a Gallery block.
 *
 * @param {HTMLElement} galleryBlock Gallery block instance.
 * @param {number}      rowIndex     Row position within the Gallery block.
 * @return {HTMLElement} Gallery item.
 */
export const getGalleryItem = ( galleryBlock, rowIndex ) =>
	getInnerBlock( galleryBlock, 'Image', { rowIndex } );

/**
 * Generates the HTML of a Gallery block.
 *
 * @param {number}  numberOfItems         Number of gallery items to generate.
 * @param {Object}  media                 Contains media data to be used in the generation.
 * @param {Object}  [options]             Configuration options for the generation.
 * @param {boolean} [options.useLocalUrl] Specifies if the items should use the local URL instead of the server URL.
 * @return {string} Gallery block HTML.
 */
export const generateGalleryBlock = (
	numberOfItems,
	media,
	{ useLocalUrl = false } = {}
) => {
	const galleryItems = [ ...Array( numberOfItems ) ]
		.map( ( _, index ) => {
			const id = useLocalUrl
				? media[ index ].localId
				: media[ index ].serverId;
			const url = useLocalUrl
				? media[ index ].localUrl
				: media[ index ].serverUrl;
			return `<!-- wp:image {"id":${ id }} -->
            <figure class="wp-block-image"><img src="${ url }" alt="" class="wp-image-${ id }"/></figure>
            <!-- /wp:image -->`;
		} )
		.join( '\n\n' );

	return `<!-- wp:gallery {"linkTo":"none"} -->
    <figure class="wp-block-gallery has-nested-images columns-default is-cropped">${ galleryItems }</figure>
    <!-- /wp:gallery -->`;
};
