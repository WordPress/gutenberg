/**
 * External dependencies
 */
import RNReactNativeGutenbergBridge from 'react-native-gutenberg-bridge';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';

/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/block-library';
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

describe( 'Editor', () => {
	beforeAll( registerCoreBlocks );

	it( 'detects unsupported block and sends hasUnsupportedBlocks true to native', () => {
		jest.useFakeTimers();
		RNReactNativeGutenbergBridge.editorDidMount = jest.fn();

		const appContainer = renderEditorWith( unsupportedBlock );
		// for some reason resetEditorBlocks() is asynchronous when dispatching editEntityRecord
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

// Utilities
const renderEditorWith = ( content ) => {
	return mount(
		<Editor
			initialHtml={ content }
			initialHtmlModeEnabled={ false }
			initialTitle={ '' }
			postType="post"
		/>
	);
};
