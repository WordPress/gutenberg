/**
 * External dependencies
 */
import {
	act,
	addBlock,
	fireEvent,
	getBlock,
	initializeEditor,
	render,
	setupCoreBlocks,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import RNReactNativeGutenbergBridge, {
	subscribeParentToggleHTMLMode,
} from '@wordpress/react-native-bridge';
// Force register 'core/editor' store.
import { store } from '@wordpress/editor'; // eslint-disable-line no-unused-vars

/**
 * Internal dependencies
 */
import '..';
import Editor from '../editor';

const unsupportedBlock = `
<!-- wp:notablock -->
<p>Not supported</p>
<!-- /wp:notablock -->
`;

beforeAll( () => {
	jest.useFakeTimers( { legacyFakeTimers: true } );
} );

afterAll( () => {
	jest.runOnlyPendingTimers();
	jest.useRealTimers();
} );

setupCoreBlocks();

describe( 'Editor', () => {
	it( 'detects unsupported block and sends hasUnsupportedBlocks true to native', () => {
		RNReactNativeGutenbergBridge.editorDidMount = jest.fn();

		const appContainer = renderEditorWith( unsupportedBlock );
		// For some reason resetEditorBlocks() is asynchronous when dispatching editEntityRecord.
		act( () => {
			jest.runAllTicks();
		} );
		appContainer.unmount();

		expect(
			RNReactNativeGutenbergBridge.editorDidMount
		).toHaveBeenCalledTimes( 1 );
		expect(
			RNReactNativeGutenbergBridge.editorDidMount
		).toHaveBeenCalledWith( [ 'core/notablock' ] );
	} );

	it( 'toggles the editor from Visual to HTML mode', async () => {
		// Arrange
		let toggleMode;
		subscribeParentToggleHTMLMode.mockImplementation( ( callback ) => {
			toggleMode = callback;
		} );
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );

		toggleMode();

		// Assert
		const htmlEditor = await screen.findByLabelText( 'html-view-content' );
		expect( htmlEditor ).toBeVisible();
	} );
} );

// Utilities.
const renderEditorWith = ( content ) => {
	return render(
		<Editor
			initialHtml={ content }
			initialHtmlModeEnabled={ false }
			initialTitle={ '' }
			postType="post"
			postId="1"
		/>
	);
};
