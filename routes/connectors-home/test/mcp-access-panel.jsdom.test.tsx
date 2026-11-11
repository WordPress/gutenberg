import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { useDispatch, useSelect } from '@wordpress/data';
import { McpAccessPanel } from '../mcp-access-panel';

const mocks = vi.hoisted( () => ( {
	mcpAdapterData: {
		status: 'not-installed',
		endpoint: 'https://example.org/wp-json/mcp/mcp-adapter-default-server',
		canInstall: true,
		canActivate: true,
	},
	isFileModDisabled: false,
} ) );

vi.mock(
	import( '@wordpress/a11y' ),
	() =>
		( {
			speak: vi.fn(),
		} ) as unknown as typeof import( '@wordpress/a11y' )
);

vi.mock(
	import( '@wordpress/core-data' ),
	() =>
		( {
			store: 'core',
		} ) as unknown as typeof import( '@wordpress/core-data' )
);

vi.mock(
	import( '@wordpress/data' ),
	() =>
		( {
			useDispatch: vi.fn(),
			useSelect: vi.fn(),
			createSelector: vi.fn( ( fn ) => fn ),
			createRegistrySelector: vi.fn( ( fn ) => fn ),
			createReduxStore: vi.fn( () => ( {} ) ),
			combineReducers: vi.fn(
				(
					reducers: Record<
						string,
						( state: unknown, action: unknown ) => unknown
					>
				) =>
					(
						state: Record< string, unknown > = {},
						action: unknown
					) => {
						const newState: Record< string, unknown > = {};

						Object.keys( reducers ).forEach( ( key ) => {
							newState[ key ] = reducers[ key ](
								state[ key ],
								action
							);
						} );

						return newState;
					}
			),
			register: vi.fn(),
			keyedReducer: vi.fn( () => ( reducer: unknown ) => reducer ),
		} ) as unknown as typeof import( '@wordpress/data' )
);

vi.mock(
	import( '../default-connectors' ),
	() =>
		( {
			getMcpAdapterData: vi.fn( () => mocks.mcpAdapterData ),
			getIsFileModDisabled: vi.fn( () => mocks.isFileModDisabled ),
		} ) as unknown as typeof import( '../default-connectors' )
);

type StoreState = {
	plugin?: { plugin: string; status: string };
};

const TOGGLE_LABEL = 'Allow AI agents to connect';
const ENDPOINT = 'https://example.org/wp-json/mcp/mcp-adapter-default-server';
const PLUGIN_ID = 'mcp-adapter/mcp-adapter';

// Browsers move focus to the page body when the focused toggle gets disabled.
// jsdom keeps it on the toggle, so drop it the same way by hand.
function dropFocusToBody() {
	const placeholder = document.createElement( 'button' );
	document.body.append( placeholder );
	act( () => placeholder.focus() );
	act( () => placeholder.remove() );
}

const mockSaveEntityRecord = vi.fn();
const mockInvalidateResolution = vi.fn();
const mockCreateSuccessNotice = vi.fn();
const mockCreateErrorNotice = vi.fn();
const mockedUseSelect = vi.mocked( useSelect ) as Mock;
const mockedUseDispatch = vi.mocked( useDispatch ) as Mock;

describe( 'McpAccessPanel', () => {
	let storeState: StoreState;
	let selectorStore: {
		getEntityRecord: Mock;
	};

	beforeEach( () => {
		mocks.mcpAdapterData = {
			status: 'not-installed',
			endpoint: ENDPOINT,
			canInstall: true,
			canActivate: true,
		};
		mocks.isFileModDisabled = false;

		storeState = {
			plugin: undefined,
		};

		selectorStore = {
			getEntityRecord: vi.fn(
				( kind: string, name: string, id?: string ) => {
					if (
						kind === 'root' &&
						name === 'plugin' &&
						id === PLUGIN_ID
					) {
						return storeState.plugin;
					}

					return undefined;
				}
			),
		};

		mockedUseSelect.mockImplementation(
			( mapSelect: ( select: () => typeof selectorStore ) => unknown ) =>
				mapSelect( () => selectorStore )
		);

		mockSaveEntityRecord.mockReset();
		mockSaveEntityRecord.mockResolvedValue( undefined );
		mockInvalidateResolution.mockReset();
		mockCreateSuccessNotice.mockReset();
		mockCreateErrorNotice.mockReset();
		mockedUseDispatch.mockReturnValue( {
			saveEntityRecord: mockSaveEntityRecord,
			invalidateResolution: mockInvalidateResolution,
			createSuccessNotice: mockCreateSuccessNotice,
			createErrorNotice: mockCreateErrorNotice,
		} );
	} );

	it( 'is off and offers to install the plugin when it is missing', () => {
		render( <McpAccessPanel /> );

		const toggle = screen.getByLabelText( TOGGLE_LABEL );
		expect( toggle ).not.toBeChecked();
		expect( toggle ).toBeEnabled();
		expect(
			screen.getByText( /Turning this on installs and activates the/ )
		).toBeVisible();
		expect(
			screen.getByRole( 'link', { name: /MCP Adapter plugin/ } )
		).toHaveAttribute(
			'href',
			'https://wordpress.org/plugins/mcp-adapter/'
		);
		expect( screen.queryByText( ENDPOINT ) ).not.toBeInTheDocument();
	} );

	it( 'installs and activates the plugin by slug when turned on while missing', async () => {
		const user = userEvent.setup();

		render( <McpAccessPanel /> );

		await user.click( screen.getByLabelText( TOGGLE_LABEL ) );

		await waitFor( () => {
			expect( mockSaveEntityRecord ).toHaveBeenCalledWith(
				'root',
				'plugin',
				{ slug: 'mcp-adapter', status: 'active' },
				{ throwOnError: true }
			);
		} );
		expect( mockCreateSuccessNotice ).toHaveBeenCalledWith(
			'AI agents can now connect to this site.',
			expect.objectContaining( { type: 'snackbar' } )
		);
	} );

	it( 'activates the installed plugin when turned on', async () => {
		const user = userEvent.setup();
		storeState.plugin = { plugin: PLUGIN_ID, status: 'inactive' };

		render( <McpAccessPanel /> );

		expect(
			screen.getByText( /Turning this on activates the/ )
		).toBeVisible();

		await user.click( screen.getByLabelText( TOGGLE_LABEL ) );

		await waitFor( () => {
			expect( mockSaveEntityRecord ).toHaveBeenCalledWith(
				'root',
				'plugin',
				{ plugin: PLUGIN_ID, status: 'active' },
				{ throwOnError: true }
			);
		} );
	} );

	it( 'shows the endpoint and sign-in details while on, and deactivates the plugin when turned off', async () => {
		const user = userEvent.setup();
		storeState.plugin = { plugin: PLUGIN_ID, status: 'active' };

		render( <McpAccessPanel /> );

		expect( screen.getByLabelText( TOGGLE_LABEL ) ).toBeChecked();
		expect( screen.getByText( ENDPOINT ) ).toBeVisible();
		expect(
			screen.getByRole( 'link', { name: 'Application Password' } )
		).toHaveAttribute(
			'href',
			'profile.php#application-passwords-section'
		);

		await user.click( screen.getByLabelText( TOGGLE_LABEL ) );

		await waitFor( () => {
			expect( mockSaveEntityRecord ).toHaveBeenCalledWith(
				'root',
				'plugin',
				{ plugin: PLUGIN_ID, status: 'inactive' },
				{ throwOnError: true }
			);
		} );
		expect( mockCreateSuccessNotice ).toHaveBeenCalledWith(
			'AI agents can no longer connect to this site.',
			expect.objectContaining( { type: 'snackbar' } )
		);
	} );

	it( 'disables the toggle while the request runs', async () => {
		const user = userEvent.setup();
		let finish: () => void = () => {};
		mockSaveEntityRecord.mockReturnValue(
			new Promise< void >( ( resolve ) => {
				finish = resolve;
			} )
		);
		storeState.plugin = { plugin: PLUGIN_ID, status: 'inactive' };

		render( <McpAccessPanel /> );

		await user.click( screen.getByLabelText( TOGGLE_LABEL ) );

		expect( screen.getByLabelText( TOGGLE_LABEL ) ).toBeDisabled();
		expect( screen.getByText( /Activating the/ ) ).toBeVisible();

		finish();

		await waitFor( () => {
			expect( screen.getByLabelText( TOGGLE_LABEL ) ).toBeEnabled();
		} );
	} );

	it( 'returns focus to the toggle when the request finishes', async () => {
		const user = userEvent.setup();
		let finish: () => void = () => {};
		mockSaveEntityRecord.mockReturnValue(
			new Promise< void >( ( resolve ) => {
				finish = resolve;
			} )
		);
		storeState.plugin = { plugin: PLUGIN_ID, status: 'inactive' };

		render( <McpAccessPanel /> );

		await user.click( screen.getByLabelText( TOGGLE_LABEL ) );
		dropFocusToBody();

		finish();

		await waitFor( () => {
			expect( screen.getByLabelText( TOGGLE_LABEL ) ).toHaveFocus();
		} );
	} );

	it( 'leaves focus alone when the user moved it during the request', async () => {
		const user = userEvent.setup();
		let finish: () => void = () => {};
		mockSaveEntityRecord.mockReturnValue(
			new Promise< void >( ( resolve ) => {
				finish = resolve;
			} )
		);
		storeState.plugin = { plugin: PLUGIN_ID, status: 'inactive' };

		render(
			<>
				<McpAccessPanel />
				<button type="button">Elsewhere</button>
			</>
		);

		await user.click( screen.getByLabelText( TOGGLE_LABEL ) );
		await user.click( screen.getByRole( 'button', { name: 'Elsewhere' } ) );

		finish();

		await waitFor( () => {
			expect( screen.getByLabelText( TOGGLE_LABEL ) ).toBeEnabled();
		} );
		expect(
			screen.getByRole( 'button', { name: 'Elsewhere' } )
		).toHaveFocus();
	} );

	it( 'shows the server state while the plugin record loads', () => {
		mocks.mcpAdapterData.status = 'active';

		render( <McpAccessPanel /> );

		expect( screen.getByLabelText( TOGGLE_LABEL ) ).toBeChecked();
		expect( screen.getByText( ENDPOINT ) ).toBeVisible();
	} );

	it( 'uses the server state when the user cannot manage plugins', () => {
		mocks.mcpAdapterData.status = 'active';
		mocks.mcpAdapterData.canActivate = false;

		render( <McpAccessPanel /> );

		const toggle = screen.getByLabelText( TOGGLE_LABEL );
		expect( toggle ).toBeChecked();
		expect( toggle ).toBeDisabled();
		expect(
			screen.getByText(
				/Only users who can manage plugins can turn it off/
			)
		).toBeVisible();
	} );

	it( 'does not request the plugin record when the user cannot manage plugins', () => {
		mocks.mcpAdapterData.status = 'active';
		mocks.mcpAdapterData.canActivate = false;

		render( <McpAccessPanel /> );

		expect( selectorStore.getEntityRecord ).not.toHaveBeenCalledWith(
			'root',
			'plugin',
			PLUGIN_ID
		);
	} );

	it( 'explains that only plugin managers can turn it on', () => {
		mocks.mcpAdapterData.status = 'inactive';
		mocks.mcpAdapterData.canActivate = false;

		render( <McpAccessPanel /> );

		expect( screen.getByLabelText( TOGGLE_LABEL ) ).toBeDisabled();
		expect(
			screen.getByText( /Only users who can manage plugins can turn on/ )
		).toBeVisible();
	} );

	it( 'shows network activation as on and locked', () => {
		storeState.plugin = { plugin: PLUGIN_ID, status: 'network-active' };

		render( <McpAccessPanel /> );

		const toggle = screen.getByLabelText( TOGGLE_LABEL );
		expect( toggle ).toBeChecked();
		expect( toggle ).toBeDisabled();
		expect( screen.getByText( /active across the network/ ) ).toBeVisible();
	} );

	it( 'explains when plugins cannot be installed on this site', () => {
		mocks.isFileModDisabled = true;
		mocks.mcpAdapterData.canInstall = false;

		render( <McpAccessPanel /> );

		expect( screen.getByLabelText( TOGGLE_LABEL ) ).toBeDisabled();
		expect(
			screen.getByText( /using your normal deployment workflow/ )
		).toBeVisible();
	} );

	it( 'disables the toggle when the user cannot install the missing plugin', () => {
		mocks.mcpAdapterData.canInstall = false;

		render( <McpAccessPanel /> );

		expect( screen.getByLabelText( TOGGLE_LABEL ) ).toBeDisabled();
		expect(
			screen.getByText( /Ask a site administrator to install it/ )
		).toBeVisible();
	} );

	it( 'shows an error notice and refetches the plugin status when a request fails', async () => {
		const user = userEvent.setup();
		mockSaveEntityRecord.mockRejectedValue( new Error( 'Install failed' ) );

		render( <McpAccessPanel /> );

		await user.click( screen.getByLabelText( TOGGLE_LABEL ) );

		await waitFor( () => {
			expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
				'Could not turn on AI agent access.',
				expect.objectContaining( { type: 'snackbar' } )
			);
		} );
		expect( mockInvalidateResolution ).toHaveBeenCalledWith(
			'getEntityRecord',
			[ 'root', 'plugin', PLUGIN_ID ]
		);
		expect( mockCreateSuccessNotice ).not.toHaveBeenCalled();
		expect( screen.getByLabelText( TOGGLE_LABEL ) ).toBeEnabled();
	} );

	it( 'keeps the endpoint row mounted when the panel re-renders', () => {
		storeState.plugin = { plugin: PLUGIN_ID, status: 'active' };

		const { rerender } = render( <McpAccessPanel /> );
		const before = screen.getByText( ENDPOINT );

		rerender( <McpAccessPanel /> );

		expect( screen.getByText( ENDPOINT ) ).toBe( before );
	} );
} );
