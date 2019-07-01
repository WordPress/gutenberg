/**
 * External dependencies
 */
import renderer from 'react-test-renderer';
import RNReactNativeGutenbergBridge from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import '../store';
import Editor from '../editor';

const unsupportedBlock = `
<!-- wp:notablock -->
<p>Not supported</p>
<!-- /wp:notablock -->
`;

describe( 'Editor', () => {
	beforeAll( registerCoreBlocks );

	it( 'detects unsupported block and sends hasUnsupportedBlocks true to native', () => {
		RNReactNativeGutenbergBridge.editorDidMount = jest.fn();

		const appContainer = renderEditorWith( unsupportedBlock );
		appContainer.unmount();

		expect( RNReactNativeGutenbergBridge.editorDidMount ).toHaveBeenCalledTimes( 1 );
		expect( RNReactNativeGutenbergBridge.editorDidMount ).toHaveBeenCalledWith( true );
	} );
} );

// Utilities
const renderEditorWith = ( content ) => {
	return renderer.create(
		<Editor
			initialHtml={ content }
			initialHtmlModeEnabled={ false }
			initialTitle={ '' }
		/>
	);
};
