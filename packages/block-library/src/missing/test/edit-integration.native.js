/**
 * External dependencies
 */
import {
	act,
	fireEvent,
	getBlock,
	initializeEditor,
	screen,
	setupCoreBlocks,
	withFakeTimers,
	within,
} from 'test/helpers';
import { Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { unregisterBlockType } from '@wordpress/blocks';
import { setLocaleData } from '@wordpress/i18n';
import { requestUnsupportedBlockFallback } from '@wordpress/react-native-bridge';

// Override modal mock to prevent unmounting it when is not visible.
// This is required to be able to trigger onClose and onDismiss events when
// the modal is dismissed.
jest.mock( 'react-native-modal', () => {
	const mockComponent = require( 'react-native/jest/mockComponent' );
	return mockComponent( 'react-native-modal' );
} );

const TABLE_BLOCK_HTML = `<!-- wp:table -->
<figure class="wp-block-table"><table><tbody><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr></tbody></table></figure>
<!-- /wp:table -->`;
const MODAL_DISMISS_EVENT = Platform.OS === 'ios' ? 'onDismiss' : 'onModalHide';

setupCoreBlocks();

beforeAll( () => {
	// For the purpose of this test suite we consider Reusable blocks/Patterns as unsupported.
	// For this reason we unregister it to force it to be rendered as an unsupported block.
	unregisterBlockType( 'core/block' );
} );

describe( 'Unsupported block', () => {
	describe( 'localized elements', () => {
		beforeEach( () => {
			// Mock translations.
			setLocaleData( {
				'block title\u0004Table': [ 'Tabla' ],
				"'%s' is not fully-supported": [
					'«%s» no es totalmente compatible',
				],
			} );
		} );

		afterEach( () => {
			// Clean up translations.
			setLocaleData( {} );
		} );

		it( 'requests translated block title in block placeholder', async () => {
			await initializeEditor( {
				initialHtml: TABLE_BLOCK_HTML,
			} );

			const missingBlock = getBlock( screen, 'Unsupported' );

			const translatedTableTitle =
				within( missingBlock ).getByText( 'Tabla' );

			expect( translatedTableTitle ).toBeDefined();
		} );

		it( 'requests translated block title in bottom sheet', async () => {
			await initializeEditor( {
				initialHtml: TABLE_BLOCK_HTML,
			} );

			const missingBlock = getBlock( screen, 'Unsupported' );

			fireEvent.press( missingBlock );

			const [ helpButton ] =
				await screen.findAllByLabelText( 'Help button' );

			fireEvent.press( helpButton );

			const bottomSheetTitle = await screen.findByText(
				'«Tabla» no es totalmente compatible'
			);

			expect( bottomSheetTitle ).toBeDefined();
		} );
	} );

	it( 'requests web editor when UBE is available', async () => {
		await initializeEditor( {
			initialHtml: TABLE_BLOCK_HTML,
			capabilities: {
				unsupportedBlockEditor: true,
				canEnableUnsupportedBlockEditor: true,
			},
		} );

		const missingBlock = getBlock( screen, 'Unsupported' );
		fireEvent.press( missingBlock );

		// Tap the block to open the unsupported block details
		fireEvent.press( within( missingBlock ).getByText( 'Unsupported' ) );

		const actionButton = screen.getByText( 'Edit using web editor' );
		expect( actionButton ).toBeVisible();

		// UBE is requested after the modal hides and running a timeout
		await withFakeTimers( async () => {
			fireEvent.press( actionButton );
			fireEvent(
				screen.getByTestId( 'bottom-sheet' ),
				MODAL_DISMISS_EVENT
			);
			act( () => jest.runOnlyPendingTimers() );
		} );
		expect( requestUnsupportedBlockFallback ).toHaveBeenCalled();
	} );

	it( 'does not show web editor option when UBE is not available', async () => {
		await initializeEditor( {
			initialHtml: TABLE_BLOCK_HTML,
			capabilities: {
				unsupportedBlockEditor: false,
				canEnableUnsupportedBlockEditor: false,
			},
		} );

		const missingBlock = getBlock( screen, 'Unsupported' );
		fireEvent.press( missingBlock );

		// Tap the block to open the unsupported block details
		fireEvent.press( within( missingBlock ).getByText( 'Unsupported' ) );

		const actionButton = await screen.queryByText(
			'Edit using web editor'
		);
		expect( actionButton ).toBeNull();
	} );

	it( 'does not show web editor option when block is incompatible with UBE', async () => {
		await initializeEditor( {
			// Reusable blocks/Patterns is a block type unsupported by UBE
			initialHtml: '<!-- wp:block {"ref":7387} /-->',
			capabilities: {
				unsupportedBlockEditor: true,
				canEnableUnsupportedBlockEditor: true,
			},
		} );

		const missingBlock = getBlock( screen, 'Unsupported' );
		fireEvent.press( missingBlock );

		// Tap the block to open the unsupported block details
		fireEvent.press( within( missingBlock ).getByText( 'Unsupported' ) );

		const actionButton = await screen.queryByText(
			'Edit using web editor'
		);
		expect( actionButton ).toBeNull();
	} );
} );
