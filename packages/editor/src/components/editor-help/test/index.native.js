/**
 * External dependencies
 */
import { fireEvent, render, waitForElementToBeRemoved } from 'test/helpers';

/**
 * Internal dependencies
 */
import EditorHelp from '../index';

it( 'lists help topics', async () => {
	const screen = render( <EditorHelp isVisible /> );
	const helpTopic = await screen.findByText( 'Customize blocks' );

	expect( helpTopic ).toBeTruthy();
} );

it( 'navigates to help topic detail screen', async () => {
	const screen = render( <EditorHelp isVisible /> );
	const helpTopic = await screen.findByText( 'Customize blocks' );
	fireEvent.press( helpTopic );

	expect(
		screen.getByText(
			'Each block has its own settings. To find them, tap on a block. Its settings will appear on the toolbar at the bottom of the screen.'
		)
	).toBeTruthy();
} );

it( 'navigates back from help topic detail screen', async () => {
	const screen = render( <EditorHelp isVisible /> );
	const helpTopic = await screen.findByText( 'Customize blocks' );
	fireEvent.press( helpTopic );

	const backButton = screen.getAllByLabelText( 'Go back' );
	fireEvent.press( backButton[ backButton.length - 1 ] );

	const text =
		'Each block has its own settings. To find them, tap on a block. Its settings will appear on the toolbar at the bottom of the screen.';
	await waitForElementToBeRemoved( () =>
		screen.getByText( text, { hidden: true } )
	);

	expect( screen.queryByText( text ) ).toBeNull();
} );

it( 'dismisses when close button is pressed', async () => {
	const closeMock = jest.fn();
	const screen = render( <EditorHelp isVisible close={ closeMock } /> );
	const closeButton = await screen.findByLabelText( 'Go back' );
	fireEvent.press( closeButton );

	expect( closeMock ).toHaveBeenCalled();
} );

it( 'dismisses when parent modal backdrop is pressed', async () => {
	const onCloseMock = jest.fn();
	const screen = render( <EditorHelp isVisible onClose={ onCloseMock } /> );
	const modal = await screen.findByTestId( 'editor-help-modal' );
	fireEvent( modal, 'backdropPress' );

	expect( onCloseMock ).toHaveBeenCalled();
} );

it( 'dismisses when parent modal backdrop is swiped', async () => {
	const onCloseMock = jest.fn();
	const screen = render( <EditorHelp isVisible onClose={ onCloseMock } /> );
	const modal = await screen.findByTestId( 'editor-help-modal' );
	fireEvent( modal, 'swipeComplete' );

	expect( onCloseMock ).toHaveBeenCalled();
} );

it( 'dismisses when hardware back button is pressed', async () => {
	const onCloseMock = jest.fn();
	const screen = render( <EditorHelp isVisible onClose={ onCloseMock } /> );
	const modal = await screen.findByTestId( 'editor-help-modal' );
	fireEvent( modal, 'backButtonPress' );

	expect( onCloseMock ).toHaveBeenCalled();
} );
