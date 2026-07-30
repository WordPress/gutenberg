/**
 * External dependencies
 */
import { render } from '@testing-library/react';
/**
 * WordPress dependencies
 */
import { useRegistry, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { BlockEditorProvider, ExperimentalBlockEditorProvider } from '../';
import { store as blockEditorStore } from '../../../store';

const HasEditorSetting = ( props ) => {
	const registry = useRegistry();
	if ( props.setRegistry ) {
		props.setRegistry( registry );
	}
	return <p>Test.</p>;
};

const PreviewModeGetter = () => {
	const previewModeKeys = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const settings = getSettings();
		return {
			// This property will be removed in the future. There is a test that asserts we're throwing a deprecation warning.
			__unstableIsPreviewMode: settings.__unstableIsPreviewMode,
			isPreviewMode: settings.isPreviewMode,
		};
	}, [] );

	return <>{ JSON.stringify( previewModeKeys ) }</>;
};

describe( 'BlockEditorProvider', () => {
	let registry;
	const setRegistry = ( reg ) => {
		registry = reg;
	};
	beforeEach( () => {
		registry = undefined;
	} );
	it( 'should not allow updating experimental settings', async () => {
		render(
			<BlockEditorProvider
				settings={ {
					blockInspectorAnimation: true,
				} }
			>
				<HasEditorSetting setRegistry={ setRegistry } />
			</BlockEditorProvider>
		);
		const settings = registry.select( blockEditorStore ).getSettings();
		// `blockInspectorAnimation` setting is one of the block editor's
		// default settings, so it has a value. We're testing that its
		// value was not updated.
		expect( settings.blockInspectorAnimation ).not.toBe( true );
	} );
	it( 'should preserve stable settings', async () => {
		render(
			<BlockEditorProvider
				settings={ {
					stableSetting: 'https://example.com',
				} }
			>
				<HasEditorSetting setRegistry={ setRegistry } />
			</BlockEditorProvider>
		);
		const settings = registry.select( blockEditorStore ).getSettings();
		expect( settings ).toHaveProperty( 'stableSetting' );
	} );
	it( 'preserves deprecated getters incoming from the settings reducer', async () => {
		const consoleWarn = jest
			.spyOn( global.console, 'warn' )
			.mockImplementation();

		const { container } = render(
			<BlockEditorProvider
				settings={ {
					isPreviewMode: true,
				} }
			>
				<PreviewModeGetter />
			</BlockEditorProvider>
		);

		expect( container ).toHaveTextContent(
			JSON.stringify( {
				__unstableIsPreviewMode: true,
				isPreviewMode: true,
			} )
		);

		expect( consoleWarn ).toHaveBeenCalledWith(
			'__unstableIsPreviewMode is deprecated since version 6.8. Please use isPreviewMode instead.'
		);

		consoleWarn.mockRestore();
	} );
} );

describe( 'ExperimentalBlockEditorProvider', () => {
	let registry;
	const setRegistry = ( reg ) => {
		registry = reg;
	};
	beforeEach( () => {
		registry = undefined;
	} );
	it( 'should allow updating/adding experimental settings', async () => {
		render(
			<ExperimentalBlockEditorProvider
				settings={ {
					blockInspectorAnimation: true,
				} }
			>
				<HasEditorSetting setRegistry={ setRegistry } />
			</ExperimentalBlockEditorProvider>
		);
		const settings = registry.select( blockEditorStore ).getSettings();
		expect( settings.blockInspectorAnimation ).toBe( true );
	} );
	it( 'should preserve stable settings', async () => {
		render(
			<ExperimentalBlockEditorProvider
				settings={ {
					stableSetting: 'https://example.com',
				} }
			>
				<HasEditorSetting setRegistry={ setRegistry } />
			</ExperimentalBlockEditorProvider>
		);
		const settings = registry.select( blockEditorStore ).getSettings();
		expect( settings ).toHaveProperty( 'stableSetting' );
	} );
} );
