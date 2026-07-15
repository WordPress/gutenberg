/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

import type { __experimentalApiKeySource as ApiKeySource } from '@wordpress/connectors';

export type PluginStatus = 'checking' | 'not-installed' | 'inactive' | 'active';

type ApplicationPasswordSettingValue = {
	username: string;
	password: string;
};

type ConnectorSettingValue = string | ApplicationPasswordSettingValue;

interface UseConnectorPluginOptions {
	file?: string;
	settingName: string;
	connectorName: string;
	isInstalled?: boolean;
	isActivated?: boolean;
	keySource?: ApiKeySource;
	initialIsConnected?: boolean;
}

interface UseConnectorPluginReturn {
	pluginStatus: PluginStatus;
	canInstallPlugins: boolean | undefined;
	canActivatePlugins: boolean | undefined;
	isExpanded: boolean;
	setIsExpanded: ( expanded: boolean ) => void;
	isBusy: boolean;
	isConnected: boolean;
	currentApiKey: string;
	currentUsername: string;
	hasResolvedSettings: boolean;
	keySource: ApiKeySource;
	handleButtonClick: () => void;
	getButtonLabel: () => string;
	saveApiKey: ( apiKey: string ) => Promise< void >;
	removeApiKey: () => Promise< void >;
	saveCredentials: ( credentials: {
		username: string;
		applicationPassword: string;
	} ) => Promise< void >;
	removeCredentials: () => Promise< void >;
}

export function useConnectorPlugin( {
	file: pluginFileFromServer,
	settingName,
	connectorName,
	isInstalled,
	isActivated,
	keySource = 'none',
	initialIsConnected = false,
}: UseConnectorPluginOptions ): UseConnectorPluginReturn {
	const [ isExpanded, setIsExpanded ] = useState( false );
	const [ isBusy, setIsBusy ] = useState( false );
	const [ connectedState, setConnectedState ] =
		useState( initialIsConnected );
	// Local override for immediate UI feedback after install/activate.
	const [ pluginStatusOverride, setPluginStatusOverride ] =
		useState< PluginStatus | null >( null );

	const pluginBasename = pluginFileFromServer?.replace( /\.php$/, '' );
	const pluginSlug = pluginBasename?.includes( '/' )
		? pluginBasename.split( '/' )[ 0 ]
		: pluginBasename;

	const {
		derivedPluginStatus,
		canManagePlugins,
		currentApiKey,
		currentUsername,
		hasStoredCredentials,
		hasResolvedSettings,
		canInstallPlugins,
	} = useSelect(
		( select ) => {
			const store = select( coreStore );
			const siteSettings = store.getEntityRecord( 'root', 'site' ) as
				| Record<
						string,
						| string
						| {
								username?: string;
								password?: string;
						  }
				  >
				| undefined;
			const settingValue = siteSettings?.[ settingName ];
			const apiKey = typeof settingValue === 'string' ? settingValue : '';
			const credentials =
				typeof settingValue === 'object' && settingValue !== null
					? settingValue
					: undefined;
			const credentialsExist =
				credentials !== undefined
					? !! credentials.username && !! credentials.password
					: !! apiKey;
			const settingsResolved = store.hasFinishedResolution(
				'getEntityRecord',
				[ 'root', 'site' ]
			);

			const canCreate = !! store.canUser( 'create', {
				kind: 'root',
				name: 'plugin',
			} );

			const common = {
				currentApiKey: apiKey,
				currentUsername: credentials?.username ?? '',
				hasStoredCredentials: credentialsExist,
				hasResolvedSettings: settingsResolved,
				canInstallPlugins: canCreate,
			};

			if ( ! pluginFileFromServer ) {
				return {
					...common,
					derivedPluginStatus: ( settingsResolved
						? 'active'
						: 'checking' ) as PluginStatus,
					canManagePlugins: undefined as boolean | undefined,
				};
			}

			const plugin = store.getEntityRecord(
				'root',
				'plugin',
				pluginBasename
			) as { plugin: string; status: string } | undefined;

			const hasFinished = store.hasFinishedResolution(
				'getEntityRecord',
				[ 'root', 'plugin', pluginBasename ]
			);

			if ( ! hasFinished ) {
				return {
					...common,
					derivedPluginStatus: 'checking' as PluginStatus,
					canManagePlugins: undefined as boolean | undefined,
				};
			}

			// Plugin data resolved — user has API permissions.
			if ( plugin ) {
				// Treat both single-site and network-active plugins as active.
				const isPluginActive =
					plugin.status === 'active' ||
					plugin.status === 'network-active';
				return {
					...common,
					derivedPluginStatus: ( isPluginActive
						? 'active'
						: 'inactive' ) as PluginStatus,
					canManagePlugins: true,
				};
			}

			// Resolution finished but plugin is undefined — either not
			// installed or a 403 (no permissions). Fall back to the
			// server-provided status.
			let status: PluginStatus = 'not-installed';
			if ( isActivated ) {
				status = 'active';
			} else if ( isInstalled ) {
				status = 'inactive';
			}
			return {
				...common,
				derivedPluginStatus: status,
				canManagePlugins: false,
			};
		},
		[
			pluginFileFromServer,
			pluginBasename,
			settingName,
			isInstalled,
			isActivated,
		]
	);

	const pluginStatus = pluginStatusOverride ?? derivedPluginStatus;

	// Use canManagePlugins (from plugin entity resolution) for activation capability.
	const canActivatePlugins = canManagePlugins;

	const isConnected =
		( pluginStatus === 'active' && connectedState ) ||
		// After install/activate, if settings re-fetch reveals stored credentials,
		// update connected state (mirrors what the server would report on page load).
		( pluginStatusOverride === 'active' && hasStoredCredentials );

	const { saveEntityRecord, invalidateResolution } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const saveConnectorSetting = ( value: ConnectorSettingValue ) =>
		saveEntityRecord(
			'root',
			'site',
			{ [ settingName ]: value },
			{ throwOnError: true }
		);

	const createConnectedNotice = () => {
		createSuccessNotice(
			sprintf(
				/* translators: %s: Name of the connector (e.g. "OpenAI"). */
				__( '%s connected successfully.' ),
				connectorName
			),
			{
				id: 'connector-connect-success',
				type: 'snackbar',
			}
		);
	};

	const createDisconnectedNotice = () => {
		createSuccessNotice(
			sprintf(
				/* translators: %s: Name of the connector (e.g. "OpenAI"). */
				__( '%s disconnected.' ),
				connectorName
			),
			{
				id: 'connector-disconnect-success',
				type: 'snackbar',
			}
		);
	};

	const createDisconnectErrorNotice = () => {
		createErrorNotice(
			sprintf(
				/* translators: %s: Name of the connector (e.g. "OpenAI"). */
				__( 'Failed to disconnect %s.' ),
				connectorName
			),
			{
				id: 'connector-disconnect-error',
				type: 'snackbar',
			}
		);
	};

	const installPlugin = async () => {
		if ( ! pluginSlug ) {
			return;
		}
		setIsBusy( true );
		try {
			await saveEntityRecord(
				'root',
				'plugin',
				{ slug: pluginSlug, status: 'active' },
				{ throwOnError: true }
			);
			setPluginStatusOverride( 'active' );
			// Re-fetch settings since the new plugin may register new settings.
			invalidateResolution( 'getEntityRecord', [ 'root', 'site' ] );
			setIsExpanded( true );
			createSuccessNotice(
				sprintf(
					/* translators: %s: Name of the connector (e.g. "OpenAI"). */
					__( 'Plugin for %s installed and activated successfully.' ),
					connectorName
				),
				{
					id: 'connector-plugin-install-success',
					type: 'snackbar',
				}
			);
		} catch {
			createErrorNotice(
				sprintf(
					/* translators: %s: Name of the connector (e.g. "OpenAI"). */
					__( 'Failed to install plugin for %s.' ),
					connectorName
				),
				{
					id: 'connector-plugin-install-error',
					type: 'snackbar',
				}
			);
		} finally {
			setIsBusy( false );
		}
	};

	const activatePlugin = async () => {
		if ( ! pluginFileFromServer ) {
			return;
		}
		setIsBusy( true );
		try {
			await saveEntityRecord(
				'root',
				'plugin',
				{
					plugin: pluginBasename,
					status: 'active',
				},
				{ throwOnError: true }
			);
			setPluginStatusOverride( 'active' );
			// Re-fetch settings since the activated plugin may register new settings.
			invalidateResolution( 'getEntityRecord', [ 'root', 'site' ] );
			setIsExpanded( true );
			createSuccessNotice(
				sprintf(
					/* translators: %s: Name of the connector (e.g. "OpenAI"). */
					__( 'Plugin for %s activated successfully.' ),
					connectorName
				),
				{
					id: 'connector-plugin-activate-success',
					type: 'snackbar',
				}
			);
		} catch {
			createErrorNotice(
				sprintf(
					/* translators: %s: Name of the connector (e.g. "OpenAI"). */
					__( 'Failed to activate plugin for %s.' ),
					connectorName
				),
				{
					id: 'connector-plugin-activate-error',
					type: 'snackbar',
				}
			);
		} finally {
			setIsBusy( false );
		}
	};

	const handleButtonClick = () => {
		if ( pluginStatus === 'not-installed' ) {
			if ( canInstallPlugins === false ) {
				return;
			}
			installPlugin();
		} else if ( pluginStatus === 'inactive' ) {
			if ( canActivatePlugins === false ) {
				return;
			}
			activatePlugin();
		} else {
			setIsExpanded( ! isExpanded );
		}
	};

	const getButtonLabel = () => {
		if ( isBusy ) {
			return pluginStatus === 'not-installed'
				? __( 'Installing…' )
				: __( 'Activating…' );
		}
		if ( isExpanded ) {
			return __( 'Cancel' );
		}
		if ( isConnected ) {
			return __( 'Edit' );
		}
		switch ( pluginStatus ) {
			case 'checking':
				return __( 'Checking…' );
			case 'not-installed':
				return __( 'Install' );
			case 'inactive':
				return __( 'Activate' );
			case 'active':
				return __( 'Set up' );
		}
	};

	const saveApiKey = async ( apiKey: string ) => {
		const previousApiKey = currentApiKey;
		try {
			const updatedRecord = await saveConnectorSetting( apiKey );

			// The server rejects invalid keys in two ways:
			// 1. Returns the previous (unchanged) value
			// 2. Returns an empty value
			// In both cases, the key we sent was not accepted.
			const record = updatedRecord as
				| Record< string, string >
				| undefined;
			const returnedKey = record?.[ settingName ];
			if (
				apiKey &&
				( returnedKey === previousApiKey || ! returnedKey )
			) {
				throw new Error(
					'It was not possible to connect to the provider using this key.'
				);
			}

			setConnectedState( true );
			createConnectedNotice();
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to save API key:', error );
			// The error is rendered with role="alert" in the UI,
			// which already announces it to screen readers.
			throw error;
		}
	};

	const saveCredentials = async ( {
		username,
		applicationPassword,
	}: {
		username: string;
		applicationPassword: string;
	} ) => {
		try {
			const updatedRecord = await saveConnectorSetting( {
				username,
				password: applicationPassword,
			} );
			const record = updatedRecord as
				| Record< string, { username?: string; password?: string } >
				| undefined;
			const credentials = record?.[ settingName ];
			// The server sanitizes the username, so verify persistence rather
			// than exact equality.
			if ( ! credentials?.username || ! credentials?.password ) {
				throw new Error(
					__( 'It was not possible to save these credentials.' )
				);
			}

			setConnectedState( true );
			createConnectedNotice();
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to save credentials:', error );
			// The error is rendered with role="alert" in the UI,
			// which already announces it to screen readers.
			throw error;
		}
	};

	const removeApiKey = async () => {
		try {
			await saveConnectorSetting( '' );
			// Store auto-updates; currentApiKey reactively becomes ''.
			setConnectedState( false );
			createDisconnectedNotice();
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to remove API key:', error );
			createDisconnectErrorNotice();
		}
	};

	const removeCredentials = async () => {
		try {
			await saveConnectorSetting( {
				username: '',
				password: '',
			} );
			setConnectedState( false );
			createDisconnectedNotice();
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to remove credentials:', error );
			createDisconnectErrorNotice();
		}
	};

	return {
		pluginStatus,
		canInstallPlugins,
		canActivatePlugins,
		isExpanded,
		setIsExpanded,
		isBusy,
		isConnected,
		currentApiKey,
		currentUsername,
		hasResolvedSettings,
		keySource,
		handleButtonClick,
		getButtonLabel,
		saveApiKey,
		removeApiKey,
		saveCredentials,
		removeCredentials,
	};
}
