/**
 * External dependencies
 */
import { initializeEditor, fireEvent, within } from 'test/helpers';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { setLocaleData } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { registerCoreBlocks } from '../..';

beforeAll( () => {
	// Mock translations.
	setLocaleData( {
		'block title\u0004Table': [ 'Tabla' ],
		"'%s' is not fully-supported": [ '«%s» no es totalmente compatible' ],
	} );

	// Register all core blocks.
	registerCoreBlocks();
} );

afterAll( () => {
	// Clean up translations.
	setLocaleData( {} );

	// Clean up registered blocks.
	getBlockTypes().forEach( ( block ) => {
		unregisterBlockType( block.name );
	} );
} );

describe( 'Unsupported block', () => {
	it( 'requests translated block title in block placeholder', async () => {
		const initialHtml = `<!-- wp:table -->
			 <figure class="wp-block-table"><table><tbody><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr></tbody></table></figure>
			 <!-- /wp:table -->`;
		const screen = await initializeEditor( {
			initialHtml,
		} );

		const [ missingBlock ] = await screen.findAllByLabelText(
			/Unsupported Block\. Row 1/
		);

		const translatedTableTitle =
			within( missingBlock ).getByText( 'Tabla' );

		expect( translatedTableTitle ).toBeDefined();
	} );

	it( 'requests translated block title in bottom sheet', async () => {
		const initialHtml = `<!-- wp:table -->
		 <figure class="wp-block-table"><table><tbody><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr></tbody></table></figure>
		 <!-- /wp:table -->`;
		const screen = await initializeEditor( {
			initialHtml,
		} );

		const [ missingBlock ] = await screen.findAllByLabelText(
			/Unsupported Block\. Row 1/
		);

		fireEvent.press( missingBlock );

		const [ helpButton ] = await screen.findAllByLabelText( 'Help button' );

		fireEvent.press( helpButton );

		const bottomSheetTitle = await screen.findByText(
			'«Tabla» no es totalmente compatible'
		);

		expect( bottomSheetTitle ).toBeDefined();
	} );
} );
