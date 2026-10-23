import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { useDispatch, useSelect } from '@wordpress/data';
import { McpAccessPanel } from '../mcp-access-panel';

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

type StoreState = {
	canCreate: boolean;
	hasFinishedResolution: boolean;
	plugin?: { plugin: string; status: string };
};

const TOGGLE_LABEL = 'Allow AI agents to connect';

const mockSaveEntityRecord = vi.fn();
const mockCreateSuccessNotice = vi.fn();
const mockCreateErrorNotice = vi.fn();
const mockedUseSelect = vi.mocked( useSelect ) as Mock;
const mockedUseDispatch = vi.mocked( useDispatch ) as Mock;

describe( 'McpAccessPanel', () => {
	let storeState: StoreState;

	beforeEach( () => {
		storeState = {
			canCreate: true,
			hasFinishedResolution: true,
			plugin: undefined,
		};

		const selectorStore = {
			canUser: vi.fn( () => storeState.canCreate ),
			getEntityRecord: vi.fn(
				( kind: string, name: string, id?: string ) => {
					if ( kind === 'root' && name === '__unstableBase' ) {
						return { url: 'https://example.org' };
					}

					if (
						kind === 'root' &&
						name === 'plugin' &&
						id === 'mcp-adapter/mcp-adapter'
					) {
						return storeState.plugin;
					}

					return undefined;
				}
			),
			hasFinishedResolution: vi.fn(
				() => storeState.hasFinishedResolution
			),
		};

		mockedUseSelect.mockImplementation(
			( mapSelect: ( select: () => typeof selectorStore ) => unknown ) =>
				mapSelect( () => selectorStore )
		);

		mockSaveEntityRecord.mockReset();
		mockSaveEntityRecord.mockResolvedValue( undefined );
		mockCreateSuccessNotice.mockReset();
		mockCreateErrorNotice.mockReset();
		mockedUseDispatch.mockReturnValue( {
			saveEntityRecord: mockSaveEntityRecord,
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
		expect(
			screen.queryByText(
				'https://example.org/wp-json/mcp/mcp-adapter-default-server'
			)
		).not.toBeInTheDocument();
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
		storeState.plugin = {
			plugin: 'mcp-adapter/mcp-adapter',
			status: 'inactive',
		};

		render( <McpAccessPanel /> );

		expect(
			screen.getByText( /Turning this on activates the/ )
		).toBeVisible();

		await user.click( screen.getByLabelText( TOGGLE_LABEL ) );

		await waitFor( () => {
			expect( mockSaveEntityRecord ).toHaveBeenCalledWith(
				'root',
				'plugin',
				{ plugin: 'mcp-adapter/mcp-adapter', status: 'active' },
				{ throwOnError: true }
			);
		} );
	} );

	it( 'shows the endpoint and sign-in details while on, and deactivates the plugin when turned off', async () => {
		const user = userEvent.setup();
		storeState.plugin = {
			plugin: 'mcp-adapter/mcp-adapter',
			status: 'active',
		};

		render( <McpAccessPanel /> );

		expect( screen.getByLabelText( TOGGLE_LABEL ) ).toBeChecked();
		expect(
			screen.getByText(
				'https://example.org/wp-json/mcp/mcp-adapter-default-server'
			)
		).toBeVisible();
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
				{ plugin: 'mcp-adapter/mcp-adapter', status: 'inactive' },
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
		storeState.plugin = {
			plugin: 'mcp-adapter/mcp-adapter',
			status: 'inactive',
		};

		render( <McpAccessPanel /> );

		await user.click( screen.getByLabelText( TOGGLE_LABEL ) );

		expect( screen.getByLabelText( TOGGLE_LABEL ) ).toBeDisabled();
		expect( screen.getByText( /Activating the/ ) ).toBeVisible();

		finish();

		await waitFor( () => {
			expect( screen.getByLabelText( TOGGLE_LABEL ) ).toBeEnabled();
		} );
	} );

	it( 'disables the toggle while the plugin status is loading', () => {
		storeState.hasFinishedResolution = false;

		render( <McpAccessPanel /> );

		expect( screen.getByLabelText( TOGGLE_LABEL ) ).toBeDisabled();
	} );

	it( 'disables the toggle when the user cannot install the missing plugin', () => {
		storeState.canCreate = false;

		render( <McpAccessPanel /> );

		expect( screen.getByLabelText( TOGGLE_LABEL ) ).toBeDisabled();
		expect(
			screen.getByText( /Ask a site administrator to install it/ )
		).toBeVisible();
	} );

	it( 'shows an error notice when turning it on fails', async () => {
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
		expect( mockCreateSuccessNotice ).not.toHaveBeenCalled();
		expect( screen.getByLabelText( TOGGLE_LABEL ) ).toBeEnabled();
	} );
} );
