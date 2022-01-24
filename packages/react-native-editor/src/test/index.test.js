/**
 * External dependencies
 */
import { AppRegistry, Text } from 'react-native';
import { render, waitFor } from 'test/helpers';

/**
 * WordPress dependencies
 */
import * as wpHooks from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { registerGutenberg } from '..';
import setupLocale from '../setup-locale';

jest.mock( 'react-native/Libraries/ReactNative/AppRegistry' );
jest.mock( '../setup-locale' );

const initGutenberg = ( registerParams ) => {
	let EditorComponent;
	AppRegistry.registerComponent.mockImplementation(
		( name, componentProvider ) => {
			EditorComponent = componentProvider();
		}
	);
	registerGutenberg( registerParams );

	return render( <EditorComponent /> );
};

describe( 'Register Gutenberg', () => {
	beforeEach( () => {
		// We need to reset modules to guarantee that setup module is imported on every test.
		jest.resetModules();
	} );

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

		initGutenberg();

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

		initGutenberg( { beforeInitCallback } );

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
		const EditorComponent = () => {
			onRenderEditor();
			return null;
		};
		jest.mock( '../setup', () => ( {
			__esModule: true,
			default: jest.fn().mockReturnValue( <EditorComponent /> ),
		} ) );

		initGutenberg();

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
		const EditorComponent = () => {
			onRenderEditor();
			return null;
		};
		jest.mock( '../setup', () => ( {
			__esModule: true,
			default: jest.fn().mockReturnValue( <EditorComponent /> ),
		} ) );

		initGutenberg();

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
		const EditorComponent = () => {
			onRenderEditor();
			return null;
		};
		jest.mock( '../setup', () => ( {
			__esModule: true,
			default: jest.fn().mockReturnValue( <EditorComponent /> ),
		} ) );

		initGutenberg();

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
		const MockEditor = () => <Text>Mock Editor</Text>;
		jest.mock( '../setup', () => {
			return {
				__esModule: true,
				default: jest.fn( () => <MockEditor /> ),
			};
		} );

		const screen = initGutenberg();
		const blockList = await waitFor( () =>
			screen.getByText( 'Mock Editor' )
		);
		expect( blockList ).toBeDefined();
	} );
} );
