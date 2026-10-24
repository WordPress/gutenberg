import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	privateApis as connectorsPrivateApis,
	type ConnectorConfig,
} from '@wordpress/connectors';
import { select } from '@wordpress/data';
import { unlock } from '@wordpress/routes-lock-unlock';
import { registerDefaultConnectors } from '../default-connectors';
import { useConnectorPlugin } from '../use-connector-plugin';

vi.mock(
	import( '../use-connector-plugin' ),
	() =>
		( {
			useConnectorPlugin: vi.fn(),
		} ) as unknown as typeof import( '../use-connector-plugin' )
);

const { store: connectorsStore } = unlock( connectorsPrivateApis );
const mockedUseConnectorPlugin = vi.mocked( useConnectorPlugin );

const MASKED_API_KEY = '•'.repeat( 16 ) + 'fj39';

function mockConnectorPlugin( {
	isConnected,
	currentApiKey,
	...overrides
}: {
	isConnected: boolean;
	currentApiKey: string;
} & Partial< ReturnType< typeof useConnectorPlugin > > ) {
	mockedUseConnectorPlugin.mockReturnValue( {
		pluginStatus: 'active',
		canInstallPlugins: true,
		canActivatePlugins: true,
		isExpanded: true,
		setIsExpanded: vi.fn(),
		isBusy: false,
		isConnected,
		currentApiKey,
		hasResolvedSettings: true,
		keySource: currentApiKey ? 'database' : 'none',
		handleButtonClick: vi.fn(),
		getButtonLabel: () => ( isConnected ? 'Edit' : 'Set up' ),
		saveApiKey: vi.fn(),
		removeApiKey: vi.fn(),
		canDeactivate: false,
		deactivatePlugin: vi.fn(),
		...overrides,
	} as unknown as ReturnType< typeof useConnectorPlugin > );
}

function renderConnector( connector: ConnectorConfig ) {
	if ( ! connector.render ) {
		throw new Error( 'The connector has no render.' );
	}

	return (
		<connector.render
			slug={ connector.slug }
			name={ connector.name }
			description={ connector.description }
			type={ connector.type }
			logo={ connector.logo }
			authentication={ connector.authentication }
			plugin={ connector.plugin }
		/>
	);
}

describe( 'API key connector', () => {
	let connector: ConnectorConfig;

	beforeEach( () => {
		document.body.innerHTML = `<script type="application/json" id="wp-script-module-data-options-connectors-wp-admin">${ JSON.stringify(
			{
				connectors: {
					openai: {
						name: 'OpenAI',
						description: 'Text and image generation.',
						type: 'ai_provider',
						authentication: {
							method: 'api_key',
							settingName: 'connectors_ai_openai_api_key',
							keySource: 'database',
							isConnected: false,
						},
					},
				},
			}
		) }</script>`;

		registerDefaultConnectors();
		connector = unlock( select( connectorsStore ) ).getConnector(
			'openai'
		);
	} );

	it( 'shows a stored key as read-only when it cannot be verified', () => {
		mockConnectorPlugin( {
			isConnected: false,
			currentApiKey: MASKED_API_KEY,
		} );

		render( renderConnector( connector ) );

		const input = screen.getByRole( 'textbox', { name: 'API Key' } );
		expect( input ).toHaveValue( MASKED_API_KEY );
		expect( input ).toBeDisabled();
		expect(
			screen.getByRole( 'button', { name: 'Remove and replace' } )
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', { name: 'Save' } )
		).not.toBeInTheDocument();
	} );

	it( 'shows an empty editable field once the stored key is removed', () => {
		mockConnectorPlugin( {
			isConnected: false,
			currentApiKey: MASKED_API_KEY,
		} );

		const { rerender } = render( renderConnector( connector ) );

		mockConnectorPlugin( { isConnected: false, currentApiKey: '' } );
		rerender( renderConnector( connector ) );

		const input = screen.getByRole( 'textbox', { name: 'API Key' } );
		expect( input ).toHaveValue( '' );
		expect( input ).toBeEnabled();
		expect(
			screen.getByRole( 'button', { name: 'Save' } )
		).toBeInTheDocument();
	} );

	describe( 'Deactivate button', () => {
		it( 'is shown when the plugin can be deactivated', () => {
			mockConnectorPlugin( {
				isConnected: true,
				currentApiKey: MASKED_API_KEY,
				isExpanded: false,
				canDeactivate: true,
			} );

			render( renderConnector( connector ) );

			expect(
				screen.getByRole( 'button', { name: 'Deactivate' } )
			).toBeVisible();
		} );

		it( 'is not shown when the plugin cannot be deactivated', () => {
			mockConnectorPlugin( {
				isConnected: true,
				currentApiKey: MASKED_API_KEY,
				isExpanded: false,
				canDeactivate: false,
			} );

			render( renderConnector( connector ) );

			expect(
				screen.queryByRole( 'button', { name: 'Deactivate' } )
			).not.toBeInTheDocument();
		} );

		it( 'is not shown while the settings are expanded', () => {
			mockConnectorPlugin( {
				isConnected: true,
				currentApiKey: MASKED_API_KEY,
				isExpanded: true,
				canDeactivate: true,
			} );

			render( renderConnector( connector ) );

			expect(
				screen.queryByRole( 'button', { name: 'Deactivate' } )
			).not.toBeInTheDocument();
		} );

		it( 'moves focus to the main action button after deactivating', async () => {
			const user = userEvent.setup();
			const deactivatePlugin = vi.fn().mockResolvedValue( true );
			mockConnectorPlugin( {
				isConnected: true,
				currentApiKey: MASKED_API_KEY,
				isExpanded: false,
				canDeactivate: true,
				deactivatePlugin,
			} );

			render( renderConnector( connector ) );

			await user.click(
				screen.getByRole( 'button', { name: 'Deactivate' } )
			);

			expect( deactivatePlugin ).toHaveBeenCalledTimes( 1 );
			await waitFor( () =>
				expect(
					screen.getByRole( 'button', { name: 'Edit' } )
				).toHaveFocus()
			);
		} );

		it( 'keeps focus on the Deactivate button when it fails', async () => {
			const user = userEvent.setup();
			mockConnectorPlugin( {
				isConnected: true,
				currentApiKey: MASKED_API_KEY,
				isExpanded: false,
				canDeactivate: true,
				deactivatePlugin: vi.fn().mockResolvedValue( false ),
			} );

			render( renderConnector( connector ) );

			const button = screen.getByRole( 'button', {
				name: 'Deactivate',
			} );
			await user.click( button );

			expect( button ).toHaveFocus();
		} );
	} );
} );

describe( 'Application password connector', () => {
	let connector: ConnectorConfig;

	beforeEach( () => {
		document.body.innerHTML = `<script type="application/json" id="wp-script-module-data-options-connectors-wp-admin">${ JSON.stringify(
			{
				connectors: {
					'example-service': {
						name: 'Example Service',
						description: 'An example service.',
						type: 'ai_provider',
						authentication: {
							method: 'application_password',
							settingName: 'connectors_example_service',
							keySource: 'database',
							isConnected: true,
						},
						plugin: {
							file: 'example-service/example-service.php',
							isInstalled: true,
							isActivated: true,
						},
					},
				},
			}
		) }</script>`;

		registerDefaultConnectors();
		connector = unlock( select( connectorsStore ) ).getConnector(
			'example-service'
		);
	} );

	it( 'shows the Deactivate button when the plugin can be deactivated', () => {
		mockConnectorPlugin( {
			isConnected: true,
			currentApiKey: '',
			isExpanded: false,
			canDeactivate: true,
		} );

		render( renderConnector( connector ) );

		expect(
			screen.getByRole( 'button', { name: 'Deactivate' } )
		).toBeVisible();
	} );
} );
