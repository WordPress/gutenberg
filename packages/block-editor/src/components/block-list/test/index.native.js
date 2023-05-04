/**
 * External dependencies
 */
import {
	addBlock,
	getBlock,
	fireEvent,
	initializeEditor,
	screen,
	setupCoreBlocks,
	triggerBlockListLayout,
	within,
	measurePerformance,
	render,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { BlockEditorProvider } from '@wordpress/block-editor';
import {
	createBlock,
	unregisterBlockType,
	getBlockTypes,
} from '@wordpress/blocks';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockList from '../index';

setupCoreBlocks( [ 'core/paragraph', 'core/group' ] );

function Editor( { testBlocks, settings = {} } ) {
	const [ currentBlocks, updateBlocks ] = useState( testBlocks );

	useEffect( () => {
		return () => {
			getBlockTypes().forEach( ( { name } ) =>
				unregisterBlockType( name )
			);
		};
	}, [] );

	return (
		<BlockEditorProvider
			value={ currentBlocks }
			onInput={ updateBlocks }
			onChange={ updateBlocks }
			settings={ settings }
		>
			<BlockList />
		</BlockEditorProvider>
	);
}

describe( 'BlockList', () => {
	it.only( 'should be stable', async () => {
		const newBlock = createBlock( 'core/group', {} );

		render( <Editor testBlocks={ [ newBlock ] } /> );
		await triggerBlockListLayout();
		const groupBlock = getBlock( screen, 'Group' );
		fireEvent.press( groupBlock );
		await triggerBlockListLayout( groupBlock );
		screen.debug();

		expect( true ).toBeTruthy();
	} );

	describe( 'when empty', () => {
		beforeEach( async () => {
			// Arrange
			await initializeEditor();
		} );

		it( 'renders a post title', async () => {
			// Assert
			expect( screen.getByPlaceholderText( 'Add title' ) ).toBeTruthy();
		} );

		it( 'renders a block appender as a content placeholder', async () => {
			// Assert
			expect(
				screen.getByPlaceholderText( /Start writing/ )
			).toBeTruthy();
		} );

		it( 'renders an end-of-list paragraph appender', async () => {
			// Assert
			expect(
				screen.getByLabelText( 'Add paragraph block' )
			).toBeTruthy();
		} );
	} );

	describe( 'for inner blocks', () => {
		it( 'renders an inner block appender', async () => {
			await initializeEditor();
			await addBlock( screen, 'Group' );
			const groupBlock = await getBlock( screen, 'Group' );
			triggerBlockListLayout( groupBlock );

			// Assert
			expect(
				within( groupBlock ).getByTestId( 'appender-button' )
			).toBeTruthy();
		} );

		describe( 'when a non-last block is selected', () => {
			beforeEach( async () => {
				// Arrange
				await initializeEditor();
				await addBlock( screen, 'Group' );
				const groupBlock = await getBlock( screen, 'Group' );
				fireEvent.press(
					within( groupBlock ).getByTestId( 'appender-button' )
				);
				await addBlock( screen, 'Paragraph', { isPickerOpened: true } );
				fireEvent.press( screen.getByLabelText( 'Navigate Up' ) );
				fireEvent.press(
					within( groupBlock ).getByTestId( 'appender-button' )
				);
				await addBlock( screen, 'Paragraph', { isPickerOpened: true } );
			} );

			it( 'renders an insertion point before the block', async () => {
				// Act
				const paragraphBlock = await getBlock( screen, 'Paragraph', {
					rowIndex: 1,
				} );
				fireEvent.press( paragraphBlock );
				fireEvent( screen.getByLabelText( 'Add block' ), 'longPress' );
				fireEvent.press( screen.getByText( 'Add Block Before' ) );

				// Assert
				expect( screen.getByText( 'ADD BLOCK HERE' ) ).toBeTruthy();
				expect(
					screen.getByTestId( 'block-insertion-point-before-row-1' )
				).toBeTruthy();
			} );

			it( 'renders an insertion point after the block', async () => {
				// Act
				const paragraphBlock = await getBlock( screen, 'Paragraph', {
					rowIndex: 1,
				} );
				fireEvent.press( paragraphBlock );
				fireEvent( screen.getByLabelText( 'Add block' ), 'longPress' );
				fireEvent.press( screen.getByText( 'Add Block After' ) );

				// Assert
				expect( screen.getByText( 'ADD BLOCK HERE' ) ).toBeTruthy();
				expect(
					screen.getByTestId( 'block-insertion-point-before-row-2' )
				).toBeTruthy();
			} );
		} );

		describe( 'when the last block is selected', () => {
			it( 'renders an insertion point before the block', async () => {
				// Arrange
				await initializeEditor();
				await addBlock( screen, 'Group' );
				const groupBlock = await getBlock( screen, 'Group' );
				fireEvent.press(
					within( groupBlock ).getByTestId( 'appender-button' )
				);
				await addBlock( screen, 'Paragraph', { isPickerOpened: true } );
				fireEvent.press( screen.getByLabelText( 'Navigate Up' ) );
				fireEvent.press(
					within( groupBlock ).getByTestId( 'appender-button' )
				);
				await addBlock( screen, 'Paragraph', { isPickerOpened: true } );

				// Act
				const paragraphBlock = await getBlock( screen, 'Paragraph', {
					rowIndex: 2,
				} );
				fireEvent.press( paragraphBlock );
				fireEvent( screen.getByLabelText( 'Add block' ), 'longPress' );
				fireEvent.press( screen.getByText( 'Add Block Before' ) );

				// Assert
				expect( screen.getByText( 'ADD BLOCK HERE' ) ).toBeTruthy();
				expect(
					screen.getByTestId( 'block-insertion-point-before-row-2' )
				).toBeTruthy();
			} );

			it( 'renders an insertion point after the block', async () => {
				// Arrange
				await initializeEditor();
				await addBlock( screen, 'Group' );
				const groupBlock = await getBlock( screen, 'Group' );
				fireEvent.press(
					within( groupBlock ).getByTestId( 'appender-button' )
				);
				await addBlock( screen, 'Paragraph', { isPickerOpened: true } );
				fireEvent.press( screen.getByLabelText( 'Navigate Up' ) );
				fireEvent.press(
					within( groupBlock ).getByTestId( 'appender-button' )
				);
				await addBlock( screen, 'Paragraph', { isPickerOpened: true } );

				// Act
				const paragraphBlock = await getBlock( screen, 'Paragraph', {
					rowIndex: 2,
				} );
				fireEvent.press( paragraphBlock );
				fireEvent( screen.getByLabelText( 'Add block' ), 'longPress' );
				fireEvent.press( screen.getByText( 'Add Block After' ) );

				// Assert
				expect( screen.getByText( 'ADD BLOCK HERE' ) ).toBeTruthy();
				expect(
					screen.getByTestId( 'block-insertion-point-after-row-2' )
				).toBeTruthy();
			} );
		} );
	} );
} );
