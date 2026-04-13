/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { AiPluginCallout } from './ai-plugin-callout';

jest.mock( '@wordpress/a11y', () => ( {
	speak: jest.fn(),
} ) );

jest.mock( '@wordpress/components', () => {
	const { createElement, forwardRef } = jest.requireActual(
		'@wordpress/element'
	);

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
					children: unknown;
					onClick?: () => void;
					disabled?: boolean;
				},
				ref
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
			children: unknown;
		} ) => createElement( 'a', { href }, children ),
	};
} );

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn(),
	useSelect: jest.fn(),
} ) );

jest.mock( './default-connectors', () => ( {
	getConnectorData: jest.fn( () => ( {
		openai: {
			type: 'ai_provider',
			authentication: {
				method: 'api_key',
				settingName: 'connectors_ai_openai_api_key',
				isConnected: false,
			},
		},
	} ) ),
} ) );

jest.mock( './wp-logo-decoration', () => ( {
	WpLogoDecoration: () => null,
} ) );

type StoreState = {
	canCreate: boolean;
	hasFinishedResolution: boolean;
	plugin?: { plugin: string; status: string };
	siteSettings?: Record< string, string >;
};

describe( 'AiPluginCallout', () => {
	let storeState: StoreState;
	let selectorStore: {
		canUser: jest.Mock;
		getEntityRecord: jest.Mock;
		hasFinishedResolution: jest.Mock;
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
			canUser: jest.fn( () => storeState.canCreate ),
			getEntityRecord: jest.fn(
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
			hasFinishedResolution: jest.fn(
				() => storeState.hasFinishedResolution
			),
		};

		( useSelect as jest.Mock ).mockImplementation(
			(
				mapSelect: (
					select: () => typeof selectorStore
				) => unknown
			) => mapSelect( () => selectorStore )
		);

		( useDispatch as jest.Mock ).mockReturnValue( {
			saveEntityRecord: jest.fn(),
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
} );
