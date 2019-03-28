/** @format */

/**
 * External dependencies
 */
import renderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { bootstrapEditor } from '..';
import AppContainer from './AppContainer';
import RNReactNativeGutenbergBridge from 'react-native-gutenberg-bridge';

const unsupportedBlock = `
<!-- wp:notablock -->
<p>Not supported</p>
<!-- /wp:notablock -->
`;

describe( 'AppContainer', () => {
	beforeAll( bootstrapEditor );

	it( 'detects unsupported block and sends hasUnsupportedBlocks true to native', () => {
		RNReactNativeGutenbergBridge.editorDidMount = jest.fn();

		const appContainer = renderAppContainerWith( unsupportedBlock );
		appContainer.unmount();

		expect( RNReactNativeGutenbergBridge.editorDidMount ).toHaveBeenCalledTimes( 1 );
		expect( RNReactNativeGutenbergBridge.editorDidMount ).toHaveBeenCalledWith( true );
	} );
} );

// Utilities
const renderAppContainerWith = ( content ) => {
	return renderer.create(
		<AppContainer
			initialHtml={ content }
			initialHtmlModeEnabled={ false }
			initialTitle={ '' }
		/>
	);
};
