/**
 * WordPress dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import { render } from '@wordpress/element';
import { RegistryProvider } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PluginPrePublishPanel from '../';

describe( 'PluginPrePublishPanel', () => {
	const mockStores = {
		'core/editor': {
			getCurrentPostType: jest.fn(),
		},
	};
	const registry = {
		select: jest
			.fn()
			.mockImplementation( ( storeName ) => mockStores[ storeName ] ),
		dispatch: jest
			.fn()
			.mockImplementation( ( storeName ) => mockStores[ storeName ] ),
		subscribe: jest.fn(),
	};

	const setMockReturnValue = ( store, functionName, value ) => {
		mockStores[ store ][ functionName ] = jest
			.fn()
			.mockReturnValue( value );
	};
	it( 'renders fill properly', () => {
		setMockReturnValue( 'core/editor', 'getCurrentPostType', '' );
		const div = document.createElement( 'div' );
		render(
			<RegistryProvider value={ registry }>
				<SlotFillProvider>
					<PluginPrePublishPanel
						className="my-plugin-pre-publish-panel"
						title="My panel title"
						initialOpen={ true }
					>
						My panel content
					</PluginPrePublishPanel>
					<PluginPrePublishPanel.Slot />
				</SlotFillProvider>
			</RegistryProvider>,
			div
		);

		expect( div.innerHTML ).toMatchSnapshot();
	} );

	it( 'Handles editorContext props', () => {
		setMockReturnValue( 'core/editor', 'getCurrentPostType', 'post' );
		const div = document.createElement( 'div' );
		render(
			<RegistryProvider value={ registry }>
				<SlotFillProvider>
					<PluginPrePublishPanel
						className="my-plugin-post-publish-panel"
						title="My panel title"
						initialOpen={ true }
					>
						{ ( props ) => {
							return (
								<p>{ `Post Type: ${ props.currentPostType }` }</p>
							);
						} }
					</PluginPrePublishPanel>
					<PluginPrePublishPanel.Slot />
				</SlotFillProvider>
			</RegistryProvider>,
			div
		);
		expect( div.innerHTML ).toMatchSnapshot();
	} );
} );
