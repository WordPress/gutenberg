import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { useDispatch, useSelect } from '@wordpress/data';
import { AiPluginCallout } from '../ai-plugin-callout';

vi.mock(
	import( '@wordpress/a11y' ),
	() =>
		( {
			speak: vi.fn(),
		} ) as unknown as typeof import('@wordpress/a11y')
);

vi.mock( import( '@wordpress/components' ), async () => {
	const { createElement, forwardRef } = await import( '@wordpress/element' );

	return {
		Button: forwardRef(
			(
				{
					href,
					children,
					onClick,
					disabled,
				}: {
					href?: string;
					children: ReactNode;
					onClick?: () => void;
					disabled?: boolean;
				},
				ref: unknown
			) =>
				href
					? createElement( 'a', { ref, href }, children )
					: createElement(
							'button',
							{ ref, type: 'button', onClick, disabled },
							children
					  )
		),
		ExternalLink: ( {
			href,
			children,
		}: {
			href: string;
			children: ReactNode;
		} ) => createElement( 'a', { href }, children ),
	} as unknown as typeof import('@wordpress/components');
} );

vi.mock(
	import( '@wordpress/core-data' ),
	() =>
		( {
			store: 'core',
		} ) as unknown as typeof import('@wordpress/core-data')
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
		} ) as unknown as typeof import('@wordpress/data')
);

vi.mock(
	import( '../default-connectors' ),
	() =>
		( {
			getConnectorData: vi.fn( () => ( {
				openai: {
					type: 'ai_provider',
					authentication: {
						method: 'api_key',
						settingName: 'connectors_ai_openai_api_key',
						isConnected: false,
					},
				},
			} ) ),
		} ) as unknown as typeof import('../default-connectors')
);

vi.mock(
	import( '../wp-logo-decoration' ),
	() =>
		( {
			WpLogoDecoration: () => null,
		} ) as unknown as typeof import('../wp-logo-decoration')
);

type StoreState = {
	canCreate: boolean;
	hasFinishedResolution: boolean;
	plugin?: { plugin: string; status: string };
	siteSettings?: Record< string, string >;
};

const mockSaveEntityRecord = vi.fn();
const mockCreateSuccessNotice = vi.fn();
const mockCreateErrorNotice = vi.fn();
const mockedUseSelect = vi.mocked( useSelect ) as Mock;
const mockedUseDispatch = vi.mocked( useDispatch ) as Mock;

describe( 'AiPluginCallout', () => {
	let storeState: StoreState;
	let selectorStore: {
		canUser: Mock;
		getEntityRecord: Mock;
		hasFinishedResolution: Mock;
	};

	beforeEach( () => {
		storeState = {
			canCreate: true,
			hasFinishedResolution: true,
			plugin: {
				plugin: 'ai/ai',
				status: 'active',
			},
			siteSettings: {},
		};

		selectorStore = {
			canUser: vi.fn( () => storeState.canCreate ),
			getEntityRecord: vi.fn(
				( kind: string, name: string, id?: string ) => {
					if ( kind === 'root' && name === 'site' ) {
						return storeState.siteSettings;
					}

					if (
						kind === 'root' &&
						name === 'plugin' &&
						id === 'ai/ai'
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

	it( 'links to the renamed AI settings page when the plugin is active without a connected provider', () => {
		render( <AiPluginCallout /> );

		expect(
			screen.getByRole( 'link', {
				name: 'Control features in the AI plugin',
			} )
		).toHaveAttribute( 'href', 'options-general.php?page=ai-wp-admin' );
	} );

	it( 'installs the AI plugin using the plugin slug', async () => {
		const user = userEvent.setup();

		storeState.plugin = undefined;

		render( <AiPluginCallout /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Install the AI plugin' } )
		);

		await waitFor( () => {
			expect( mockSaveEntityRecord ).toHaveBeenCalledWith(
				'root',
				'plugin',
				{ slug: 'ai', status: 'active' },
				{ throwOnError: true }
			);
		} );
	} );
} );
