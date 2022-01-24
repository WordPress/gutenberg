/**
 * External dependencies
 */
import { AppRegistry } from 'react-native';
import { initializeEditor, render } from 'test/helpers';

/**
 * WordPress dependencies
 */
import * as wpHooks from '@wordpress/hooks';
import '@wordpress/jest-console';

/**
 * Internal dependencies
 */
import { registerGutenberg } from '..';
import setupLocale from '../setup-locale';

jest.mock( 'react-native/Libraries/ReactNative/AppRegistry' );
jest.mock( '../setup-locale' );

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
		// Reference: https://git.io/JyBk0
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
		// Reference: https://git.io/JyBk0
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
		// Reference: https://git.io/JyBk0
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
		// Reference: https://git.io/JyBk0
		const hookCallOrder =
			applyFilters.mock.invocationCallOrder[ hookCallIndex ];
		const onRenderEditorCallOrder =
			onRenderEditor.mock.invocationCallOrder[ 0 ];
		const hookName = applyFilters.mock.calls[ hookCallIndex ][ 0 ];

		expect( hookName ).toBe( 'native.block_editor_props' );
		expect( hookCallOrder ).toBeLessThan( onRenderEditorCallOrder );
	} );

	it( 'dispatches "native.render" hook after the editor is rendered', () => {
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

		const hookCallIndex = 1;
		// "invocationCallOrder" can be used to compare call orders between different mocks.
		// Reference: https://git.io/JyBk0
		const hookCallOrder =
			doAction.mock.invocationCallOrder[ hookCallIndex ];
		const onRenderEditorCallOrder =
			onRenderEditor.mock.invocationCallOrder[ 0 ];
		const hookName = doAction.mock.calls[ hookCallIndex ][ 0 ];

		expect( hookName ).toBe( 'native.render' );
		expect( hookCallOrder ).toBeGreaterThan( onRenderEditorCallOrder );
	} );

	it( 'initializes the editor', async () => {
		// Unmock setup module to render the actual editor component.
		jest.unmock( '../setup' );

		const EditorComponent = getEditorComponent();
		const screen = initializeEditor( {}, { component: EditorComponent } );
		const blockList = screen.getByTestId( 'block-list-wrapper' );

		expect( blockList ).toHaveProperty( 'type', 'View' );
		expect( console ).toHaveLoggedWith( 'Hermes is: true' );
		// It's expected that some blocks are upgraded and inform about it (example: "Updated Block: core/cover")
		expect( console ).toHaveInformed();
	} );
} );
