/**
 * External dependencies
 */
import { AppRegistry } from 'react-native';
import { initializeEditor, render } from 'test/helpers';

/**
 * WordPress dependencies
 */
import * as wpHooks from '@wordpress/hooks';
import { registerCoreBlocks } from '@wordpress/block-library';
// eslint-disable-next-line no-restricted-imports
import * as wpEditPost from '@wordpress/edit-post';

/**
 * Internal dependencies
 */
import { registerGutenberg } from '..';
import setupLocale from '../setup-locale';

jest.mock( 'react-native/Libraries/ReactNative/AppRegistry' );
jest.mock( '../setup-locale' );
jest.mock( '@wordpress/block-library', () => ( {
	__esModule: true,
	registerCoreBlocks: jest.fn(),
	NEW_BLOCK_TYPES: {},
} ) );

const getEditorComponent = ( registerParams ) => {
	let EditorComponent;
	AppRegistry.registerComponent.mockImplementation(
		( name, componentProvider ) => {
			EditorComponent = componentProvider();
		}
	);
	registerGutenberg( registerParams );
	return EditorComponent;
};

describe( 'Register Gutenberg', () => {
	it( 'registers Gutenberg editor component', () => {
		registerGutenberg();
		expect( AppRegistry.registerComponent ).toHaveBeenCalled();
	} );

	it( 'sets up locale before editor is initialized', () => {
		const mockOnModuleImported = jest.fn();
		jest.mock( '../setup', () => {
			// To determine if the setup module is imported, we create a mock function that is called when the module is mocked.
			mockOnModuleImported();

			return {
				__esModule: true,
				default: jest.fn().mockReturnValue( <></> ),
			};
		} );

		const EditorComponent = getEditorComponent();
		// Modules are isolated upon editor rendering in order to guarantee that the setup module is imported on every test.
		jest.isolateModules( () => render( <EditorComponent /> ) );

		// "invocationCallOrder" can be used to compare call orders between different mocks.
		// Reference: https://github.com/facebook/jest/issues/4402#issuecomment-534516219
		const setupLocaleCallOrder = setupLocale.mock.invocationCallOrder[ 0 ];
		const onSetupImportedCallOrder =
			mockOnModuleImported.mock.invocationCallOrder[ 0 ];

		expect( setupLocaleCallOrder ).toBeLessThan( onSetupImportedCallOrder );
	} );

	it( 'beforeInit callback is invoked before the editor is initialized', () => {
		const beforeInitCallback = jest.fn();
		const mockOnModuleImported = jest.fn();
		jest.mock( '../setup', () => {
			// To determine if the setup module is imported, we create a mock function that is called when the module is mocked.
			mockOnModuleImported();

			return {
				__esModule: true,
				default: jest.fn().mockReturnValue( <></> ),
			};
		} );

		const EditorComponent = getEditorComponent( { beforeInitCallback } );
		// Modules are isolated upon editor rendering in order to guarantee that the setup module is imported on every test.
		jest.isolateModules( () => render( <EditorComponent /> ) );

		// "invocationCallOrder" can be used to compare call orders between different mocks.
		// Reference: https://github.com/facebook/jest/issues/4402#issuecomment-534516219
		const beforeInitCallOrder =
			beforeInitCallback.mock.invocationCallOrder[ 0 ];
		const onSetupImportedCallOrder =
			mockOnModuleImported.mock.invocationCallOrder[ 0 ];

		expect( beforeInitCallOrder ).toBeLessThan( onSetupImportedCallOrder );
	} );

	it( 'dispatches "native.pre-render" hook before the editor is rendered', () => {
		const doAction = jest.spyOn( wpHooks, 'doAction' );

		// An empty component is provided in order to listen for render calls of the editor component.
		const onRenderEditor = jest.fn();
		const MockEditor = () => {
			onRenderEditor();
			return null;
		};
		jest.mock( '../setup', () => ( {
			__esModule: true,
			default: jest.fn().mockReturnValue( <MockEditor /> ),
		} ) );

		const EditorComponent = getEditorComponent();
		// Modules are isolated upon editor rendering in order to guarantee that the setup module is imported on every test.
		jest.isolateModules( () => render( <EditorComponent /> ) );

		const hookCallIndex = 0;
		// "invocationCallOrder" can be used to compare call orders between different mocks.
		// Reference: https://github.com/facebook/jest/issues/4402#issuecomment-534516219
		const hookCallOrder =
			doAction.mock.invocationCallOrder[ hookCallIndex ];
		const onRenderEditorCallOrder =
			onRenderEditor.mock.invocationCallOrder[ 0 ];
		const hookName = doAction.mock.calls[ hookCallIndex ][ 0 ];

		expect( hookName ).toBe( 'native.pre-render' );
		expect( hookCallOrder ).toBeLessThan( onRenderEditorCallOrder );
	} );

	it( 'dispatches "native.block_editor_props" hook before the editor is rendered', () => {
		const applyFilters = jest.spyOn( wpHooks, 'applyFilters' );

		// An empty component is provided in order to listen for render calls of the editor component.
		const onRenderEditor = jest.fn();
		const MockEditor = () => {
			onRenderEditor();
			return null;
		};
		jest.mock( '../setup', () => ( {
			__esModule: true,
			default: jest.fn().mockReturnValue( <MockEditor /> ),
		} ) );

		const EditorComponent = getEditorComponent();
		// Modules are isolated upon editor rendering in order to guarantee that the setup module is imported on every test.
		jest.isolateModules( () => render( <EditorComponent /> ) );

		const hookCallIndex = 0;
		// "invocationCallOrder" can be used to compare call orders between different mocks.
		// Reference: https://github.com/facebook/jest/issues/4402#issuecomment-534516219
		const hookCallOrder =
			applyFilters.mock.invocationCallOrder[ hookCallIndex ];
		const onRenderEditorCallOrder =
			onRenderEditor.mock.invocationCallOrder[ 0 ];
		const hookName = applyFilters.mock.calls[ hookCallIndex ][ 0 ];

		expect( hookName ).toBe( 'native.block_editor_props' );
		expect( hookCallOrder ).toBeLessThan( onRenderEditorCallOrder );
	} );

	it( 'dispatches "native.post-register-core-blocks" hook after core blocks are registered', async () => {
		// An empty component is provided in order to listen for render calls of the editor component.
		const onRenderEditor = jest.fn();
		const MockEditor = () => {
			onRenderEditor();
			return null;
		};

		// Unmock setup module to render the above mocked editor component.
		jest.unmock( '../setup' );

		// The mocked editor component is provided via `initializeEditor` function of
		// `@wordpress/edit-post` package, instead of via the setup as above test cases.
		const initializeEditorMock = jest
			.spyOn( wpEditPost, 'initializeEditor' )
			.mockReturnValue( <MockEditor /> );

		// Listen to WP hook
		const callback = jest.fn();
		wpHooks.addAction(
			'native.post-register-core-blocks',
			'test',
			callback
		);

		const EditorComponent = getEditorComponent();
		render( <EditorComponent /> );

		// "invocationCallOrder" can be used to compare call orders between different mocks.
		// Reference: https://github.com/facebook/jest/issues/4402#issuecomment-534516219
		const callbackCallOrder = callback.mock.invocationCallOrder[ 0 ];
		const registerCoreBlocksCallOrder =
			registerCoreBlocks.mock.invocationCallOrder[ 0 ];
		const onRenderEditorCallOrder =
			onRenderEditor.mock.invocationCallOrder[ 0 ];

		expect( callbackCallOrder ).toBeGreaterThan(
			registerCoreBlocksCallOrder
		);
		expect( callbackCallOrder ).toBeLessThan( onRenderEditorCallOrder );

		initializeEditorMock.mockRestore();
	} );

	it( 'initializes the editor', async () => {
		const screen = await initializeEditor();
		// Inner blocks create BlockLists so let's take into account selecting the main one
		const blockList = screen.getAllByTestId( 'block-list-wrapper' )[ 0 ];

		expect( blockList ).toBeVisible();
	} );
} );
