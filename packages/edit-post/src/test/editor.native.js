/**
 * External dependencies
 */
import { act, render } from 'test/helpers';

/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/block-library';
import RNReactNativeGutenbergBridge from '@wordpress/react-native-bridge';
// Force register 'core/editor' store.
import { store } from '@wordpress/editor'; // eslint-disable-line no-unused-vars

jest.mock( '../components/layout', () => () => 'Layout' );

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

jest.useFakeTimers( 'legacy' );

describe( 'Editor', () => {
	beforeAll( registerCoreBlocks );

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
