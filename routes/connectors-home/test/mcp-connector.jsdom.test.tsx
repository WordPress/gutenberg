import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import { privateApis as connectorsPrivateApis } from '@wordpress/connectors';
import { select } from '@wordpress/data';
import { unlock } from '@wordpress/routes-lock-unlock';
import { registerDefaultConnectors } from '../default-connectors';
import { useConnectorPlugin } from '../use-connector-plugin';
import type {
	ApplicationPasswordsData,
	McpApplicationPassword,
} from '../mcp-connector';

vi.mock( import( '@wordpress/api-fetch' ) );
vi.mock(
	import( '../use-connector-plugin' ),
	() =>
		( {
			useConnectorPlugin: vi.fn(),
		} ) as unknown as typeof import( '../use-connector-plugin' )
);

const { store: connectorsStore } = unlock( connectorsPrivateApis );
const mockedApiFetch = vi.mocked( apiFetch );

const ENDPOINT = 'https://example.com/wp-json/mcp/mcp-adapter-default-server';
const PASSWORD = 'abcd efgh ijkl mnop qrst uvwx';
const MCP_INDEX = {
	routes: {
		'/mcp/mcp-adapter-default-server': {
			_links: { self: [ { href: ENDPOINT } ] },
		},
	},
};

const MCP_PASSWORD: McpApplicationPassword = {
	uuid: '6f1c2a8e-3b4d-4e5f-9a0b-1c2d3e4f5a6b',
	app_id: '19cb6628-2ea1-436f-a865-dcc745478535',
	name: 'Claude Code',
	created: '2026-10-16T12:00:00',
	last_used: null,
};
const OTHER_PASSWORD: McpApplicationPassword = {
	...MCP_PASSWORD,
	uuid: '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
	app_id: '',
	name: 'Mobile app',
};

const APPLICATION_PASSWORDS: ApplicationPasswordsData = {
	isSupported: true,
	isAvailable: true,
	isAvailableForUser: true,
	canCreate: true,
	username: 'admin',
	profileUrl:
		'https://example.com/wp-admin/profile.php#application-passwords-section',
};

function mockApiFetch( {
	mcpIndex = async () => MCP_INDEX,
	applicationPasswords = async () => [],
	createPassword,
	revokePassword,
}: {
	mcpIndex?: () => Promise< unknown >;
	applicationPasswords?: () => Promise< unknown >;
	createPassword?: () => Promise< unknown >;
	revokePassword?: () => Promise< unknown >;
} = {} ) {
	mockedApiFetch.mockImplementation( ( ( options: {
		path?: string;
		method?: string;
	} ) => {
		if ( options.path === '/mcp' ) {
			return mcpIndex();
		}
		if ( options.method === 'POST' ) {
			return createPassword?.();
		}
		if ( options.method === 'DELETE' ) {
			return revokePassword?.();
		}
		return applicationPasswords();
	} ) as typeof apiFetch );
}

function mockConnectorPlugin( { isExpanded = true } = {} ) {
	vi.mocked( useConnectorPlugin ).mockReturnValue( {
		pluginStatus: 'active',
		canInstallPlugins: true,
		canActivatePlugins: true,
		isExpanded,
		isBusy: false,
		handleButtonClick: vi.fn(),
		getButtonLabel: () => 'Set up',
	} as unknown as ReturnType< typeof useConnectorPlugin > );
}

function renderMcpConnector(
	applicationPasswords: ApplicationPasswordsData = APPLICATION_PASSWORDS
) {
	document.body.innerHTML = `<script type="application/json" id="wp-script-module-data-options-connectors-wp-admin">${ JSON.stringify(
		{
			connectors: {
				'mcp-adapter': {
					name: 'WordPress MCP',
					description:
						'Connect AI agents and MCP clients to this site.',
					type: 'mcp_server',
					authentication: { method: 'none' },
					plugin: {
						file: 'mcp-adapter/mcp-adapter.php',
						isInstalled: true,
						isActivated: true,
					},
				},
			},
			applicationPasswords,
		}
	) }</script>`;

	registerDefaultConnectors();
	const connector = unlock( select( connectorsStore ) ).getConnector(
		'mcp-adapter'
	);
	if ( ! connector?.render ) {
		throw new Error( 'The MCP connector has no render.' );
	}

	return render(
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

describe( 'MCP connector', () => {
	beforeEach( () => {
		mockedApiFetch.mockReset();
		mockConnectorPlugin();
	} );

	it( 'shows the endpoint of the default MCP server from the REST API index', async () => {
		mockApiFetch();

		renderMcpConnector();

		expect(
			await screen.findByRole( 'textbox', { name: 'MCP endpoint' } )
		).toHaveValue( ENDPOINT );
		expect( mockedApiFetch ).toHaveBeenCalledWith( { path: '/mcp' } );
		expect( screen.getByRole( 'button', { name: 'Close' } ) ).toBeVisible();
	} );

	it( 'explains when the default MCP server is not registered', async () => {
		mockApiFetch( {
			mcpIndex: async () => {
				throw { code: 'rest_no_route' };
			},
		} );

		renderMcpConnector();

		expect(
			await screen.findByText(
				'The MCP Adapter is active, but its default MCP server was not found.'
			)
		).toBeVisible();
	} );

	it( 'explains when the REST API request fails', async () => {
		mockApiFetch( {
			mcpIndex: async () => {
				throw { code: 'fetch_error' };
			},
		} );

		renderMcpConnector();

		expect(
			await screen.findByText(
				'The MCP endpoint could not be loaded. Check that the REST API is reachable, then reload this page.'
			)
		).toBeVisible();
	} );

	it( 'explains why application passwords are unavailable', async () => {
		mockApiFetch();

		renderMcpConnector( {
			...APPLICATION_PASSWORDS,
			isSupported: false,
			isAvailable: false,
			isAvailableForUser: false,
		} );

		expect(
			await screen.findByText(
				'Application passwords require HTTPS. Set up HTTPS for this site, then reload this page.'
			)
		).toBeVisible();
		expect(
			screen.queryByRole( 'textbox', { name: 'Name' } )
		).not.toBeInTheDocument();
		expect( mockedApiFetch ).not.toHaveBeenCalledWith( {
			path: '/wp/v2/users/me/application-passwords',
		} );
	} );

	it( 'offers to manage the application passwords created on this card', async () => {
		mockConnectorPlugin( { isExpanded: false } );
		mockApiFetch( {
			applicationPasswords: async () => [ MCP_PASSWORD, OTHER_PASSWORD ],
		} );

		renderMcpConnector();

		expect(
			await screen.findByRole( 'button', { name: 'Manage' } )
		).toBeVisible();
		// The endpoint loads before the card opens.
		expect( mockedApiFetch ).toHaveBeenCalledWith( { path: '/mcp' } );
	} );

	it( 'lists only the application passwords created on this card', async () => {
		mockApiFetch( {
			applicationPasswords: async () => [ MCP_PASSWORD, OTHER_PASSWORD ],
		} );

		renderMcpConnector();

		expect( await screen.findByText( 'Claude Code' ) ).toBeVisible();
		expect(
			screen.getByText( 'Created October 16, 2026 · Never used' )
		).toBeVisible();
		expect( screen.queryByText( 'Mobile app' ) ).not.toBeInTheDocument();
		expect(
			screen.getByText(
				'Only application passwords created here are listed.'
			)
		).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Add application password' } )
		).toBeVisible();
	} );

	it( 'creates an application password and shows the client credentials', async () => {
		const user = userEvent.setup();
		mockApiFetch( {
			createPassword: async () => ( {
				...MCP_PASSWORD,
				password: PASSWORD,
			} ),
		} );

		renderMcpConnector();

		await user.type(
			await screen.findByRole( 'textbox', { name: 'Name' } ),
			'Claude Code'
		);
		await user.click(
			screen.getByRole( 'button', {
				name: 'Create application password',
			} )
		);

		expect( mockedApiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/users/me/application-passwords',
			method: 'POST',
			data: { name: 'Claude Code', app_id: MCP_PASSWORD.app_id },
		} );
		expect(
			await screen.findByRole( 'textbox', {
				name: 'Application password',
			} )
		).toHaveValue( PASSWORD );
		expect(
			screen.getByRole( 'textbox', { name: 'Username' } )
		).toHaveValue( 'admin' );
		expect(
			screen.getByRole( 'textbox', { name: 'Authorization header' } )
		).toHaveValue( `Basic ${ window.btoa( `admin:${ PASSWORD }` ) }` );
		expect( screen.getByText( 'Claude Code' ) ).toBeVisible();
	} );

	it( 'shows the error when the application password cannot be created', async () => {
		const user = userEvent.setup();
		mockApiFetch( {
			createPassword: async () => {
				throw { message: 'Each application name should be unique.' };
			},
		} );

		renderMcpConnector();

		await user.type(
			await screen.findByRole( 'textbox', { name: 'Name' } ),
			'Claude Code'
		);
		await user.click(
			screen.getByRole( 'button', {
				name: 'Create application password',
			} )
		);

		expect( await screen.findByRole( 'alert' ) ).toHaveTextContent(
			'Each application name should be unique.'
		);
	} );

	it( 'revokes an application password after confirmation', async () => {
		const user = userEvent.setup();
		mockApiFetch( {
			applicationPasswords: async () => [ MCP_PASSWORD ],
			revokePassword: async () => ( { deleted: true } ),
		} );

		renderMcpConnector();

		await user.click(
			await screen.findByRole( 'button', {
				name: 'Revoke "Claude Code"',
			} )
		);
		await user.click(
			within( screen.getByRole( 'dialog' ) ).getByRole( 'button', {
				name: 'Revoke',
			} )
		);

		expect( mockedApiFetch ).toHaveBeenCalledWith( {
			path: `/wp/v2/users/me/application-passwords/${ MCP_PASSWORD.uuid }`,
			method: 'DELETE',
		} );
		expect(
			await screen.findByRole( 'textbox', { name: 'Name' } )
		).toBeVisible();
		expect( screen.queryByText( 'Claude Code' ) ).not.toBeInTheDocument();
	} );
} );
