/**
 * External dependencies
 */
import {
	fireEvent,
	initializeEditor,
	getBlock,
	getEditorHtml,
	render,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import { BlockMover } from '../index';

const INITIAL_HTML = `<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->
<!-- wp:spacer -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->
<!-- wp:heading -->
<h2 class="wp-block-heading"></h2>
<!-- /wp:heading -->`;

describe( 'Block Mover Picker', () => {
	it( 'renders without crashing', () => {
		const props = {
			isFirst: false,
			isLast: true,
			canMove: true,
			numberOfBlocks: 2,
			firstIndex: 1,

			onMoveDown: jest.fn(),
			onMoveUp: jest.fn(),
			onLongPress: jest.fn(),

			rootClientId: '',
			isStackedHorizontally: true,
		};
		const screen = render( <BlockMover { ...props } /> );
		expect( screen.container ).toBeTruthy();
	} );

	it( 'should match snapshot', () => {
		const props = {
			isFirst: false,
			isLast: true,
			canMove: true,
			numberOfBlocks: 2,
			firstIndex: 1,

			onMoveDown: jest.fn(),
			onMoveUp: jest.fn(),
			onLongPress: jest.fn(),

			rootClientId: '',
			isStackedHorizontally: true,
		};
		const screen = render( <BlockMover { ...props } /> );
		expect( screen.toJSON() ).toMatchSnapshot();
	} );

	describe( 'moving blocks', () => {
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

		it( 'moves blocks up and down', async () => {
			const screen = await initializeEditor( {
				initialHtml: INITIAL_HTML,
			} );
			const { getByLabelText } = screen;

			// Get Spacer block
			const spacerBlock = await getBlock( screen, 'Spacer', {
				rowIndex: 2,
			} );
			fireEvent.press( spacerBlock );

			// Tap on the Move Down button
			const downButton = getByLabelText(
				/Move block down from row 2 to row 3/
			);
			fireEvent.press( downButton );

			// Get Heading block
			const headingBlock = await getBlock( screen, 'Heading', {
				rowIndex: 2,
			} );
			fireEvent.press( headingBlock );

			// Tap on the Move Up button
			const upButton = getByLabelText(
				/Move block up from row 2 to row 1/
			);
			fireEvent.press( upButton );

			expect( getEditorHtml() ).toMatchSnapshot();
		} );

		it( 'disables the Move Up button for the first block', async () => {
			const screen = await initializeEditor( {
				initialHtml: INITIAL_HTML,
			} );
			const { getByLabelText } = screen;

			// Get Paragraph block
			const paragraphBlock = await getBlock( screen, 'Paragraph' );
			fireEvent.press( paragraphBlock );

			// Get the Move Up button
			const upButton = getByLabelText( /Move block up/ );
			const isUpButtonDisabled =
				upButton.props.accessibilityState?.disabled;
			expect( isUpButtonDisabled ).toBe( true );

			// Press the button to make sure the block doesn't move
			fireEvent.press( upButton );

			expect( getEditorHtml() ).toMatchSnapshot();
		} );

		it( 'disables the Move Down button for the last block', async () => {
			const screen = await initializeEditor( {
				initialHtml: INITIAL_HTML,
			} );
			const { getByLabelText } = screen;

			// Get Heading block
			const headingBlock = await getBlock( screen, 'Heading', {
				rowIndex: 3,
			} );
			fireEvent.press( headingBlock );

			// Get the Move Down button
			const downButton = getByLabelText( /Move block down/ );
			const isDownButtonDisabled =
				downButton.props.accessibilityState?.disabled;
			expect( isDownButtonDisabled ).toBe( true );

			// Press the button to make sure the block doesn't move
			fireEvent.press( downButton );

			expect( getEditorHtml() ).toMatchSnapshot();
		} );
	} );
} );
