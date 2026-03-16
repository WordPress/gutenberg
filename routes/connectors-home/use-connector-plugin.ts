/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import type { __experimentalApiKeySource as ApiKeySource } from '@wordpress/connectors';

export type PluginStatus = 'checking' | 'not-installed' | 'inactive' | 'active';

interface UseConnectorPluginOptions {
	connectorId: string;
	pluginSlug?: string;
	settingName: string;
	isInstalled?: boolean;
	isActivated?: boolean;
	keySource?: ApiKeySource;
}

interface UseConnectorPluginReturn {
	pluginStatus: PluginStatus;
	canInstallPlugins: boolean | undefined;
	canActivatePlugins: boolean | undefined;
	isExpanded: boolean;
	setIsExpanded: ( expanded: boolean ) => void;
	isBusy: boolean;
	isConnected: boolean;
	isCheckingConnection: boolean;
	currentApiKey: string;
	keySource: ApiKeySource;
	handleButtonClick: () => void;
	getButtonLabel: () => string;
	saveApiKey: ( apiKey: string ) => Promise< void >;
	removeApiKey: () => Promise< void >;
}

export function useConnectorPlugin( {
	connectorId,
	pluginSlug,
	settingName,
	isInstalled,
	isActivated,
	keySource = 'none',
}: UseConnectorPluginOptions ): UseConnectorPluginReturn {
	const [ isExpanded, setIsExpanded ] = useState( false );
	const [ isBusy, setIsBusy ] = useState( false );
	const [ connectedState, setConnectedState ] = useState< boolean | null >(
		() => {
			// Check if streaming already delivered the result before React mounted.
			const streamed = (
				window as unknown as {
					__connectorStatuses?: Record< string, boolean >;
				}
			 ).__connectorStatuses?.[ connectorId ];
			return streamed !== undefined ? streamed : null;
		}
	);

	// Listen for streamed connector-status events from the server.
	useEffect( () => {
		if ( connectedState !== null ) {
			return;
		}
		const handler = ( e: Event ) => {
			const detail = ( e as CustomEvent ).detail;
			if ( detail.id === connectorId ) {
				setConnectedState( detail.connected );
			}
		};
		document.addEventListener( 'connector-status', handler );

		// Check again in case the event fired between initial state and effect registration.
		const streamed = (
			window as unknown as {
				__connectorStatuses?: Record< string, boolean >;
			}
		 ).__connectorStatuses?.[ connectorId ];
		if ( streamed !== undefined ) {
			setConnectedState( streamed );
		}

		return () =>
			document.removeEventListener( 'connector-status', handler );
	}, [ connectorId, connectedState ] );
	// Local override for immediate UI feedback after install/activate.
	const [ pluginStatusOverride, setPluginStatusOverride ] =
		useState< PluginStatus | null >( null );

	const {
		derivedPluginStatus,
		canManagePlugins,
		currentApiKey,
		canInstallPlugins,
	} = useSelect(
		( select ) => {
			const store = select( coreStore );
			const siteSettings = store.getEntityRecord( 'root', 'site' ) as
				| Record< string, string >
				| undefined;
			const apiKey = siteSettings?.[ settingName ] ?? '';

			const canCreate = !! store.canUser( 'create', {
				kind: 'root',
				name: 'plugin',
			} );

			if ( ! pluginSlug ) {
				const hasLoaded = store.hasFinishedResolution(
					'getEntityRecord',
					[ 'root', 'site' ]
				);
				return {
					derivedPluginStatus: ( hasLoaded
						? 'active'
						: 'checking' ) as PluginStatus,
					canManagePlugins: undefined as boolean | undefined,
					currentApiKey: apiKey,
					canInstallPlugins: canCreate,
				};
			}

			const plugins = store.getEntityRecords(
				'root',
				'plugin'
			) as Array< { plugin: string; status: string } > | null;

			// plugins is null before resolution completes and when
			// the resolver fails (e.g. 403 — no permissions).
			if ( plugins === null ) {
				const hasFinished = store.hasFinishedResolution(
					'getEntityRecords',
					[ 'root', 'plugin' ]
				);

				if ( ! hasFinished ) {
					return {
						derivedPluginStatus: 'checking' as PluginStatus,
						canManagePlugins: undefined as boolean | undefined,
						currentApiKey: apiKey,
						canInstallPlugins: canCreate,
					};
				}

				// Resolution finished but returned null — fallback to server-provided status.
				let status: PluginStatus = 'not-installed';
				if ( isActivated ) {
					status = 'active';
				} else if ( isInstalled ) {
					status = 'inactive';
				}
				return {
					derivedPluginStatus: status,
					canManagePlugins: false,
					currentApiKey: apiKey,
					canInstallPlugins: canCreate,
				};
			}

			const plugin = plugins.find(
				( p ) => p.plugin === `${ pluginSlug }/plugin`
			);
			let status: PluginStatus = 'not-installed';
			if ( plugin ) {
				status = plugin.status === 'active' ? 'active' : 'inactive';
			}

			return {
				derivedPluginStatus: status,
				canManagePlugins: true,
				currentApiKey: apiKey,
				canInstallPlugins: canCreate,
			};
		},
		[ pluginSlug, settingName, isInstalled, isActivated ]
	);

	const pluginStatus = pluginStatusOverride ?? derivedPluginStatus;

	// Use canManagePlugins (from plugin entity resolution) for activation capability.
	const canActivatePlugins = canManagePlugins;

	const isCheckingConnection =
		pluginStatus === 'active' && connectedState === null;

	const isConnected =
		( pluginStatus === 'active' && connectedState === true ) ||
		// After install/activate, if settings re-fetch reveals an existing key,
		// update connected state (mirrors what the server would report on page load).
		( pluginStatusOverride === 'active' && !! currentApiKey );

	const { saveEntityRecord, invalidateResolution } = useDispatch( coreStore );

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
		} catch {
			// Handle error
		} finally {
			setIsBusy( false );
		}
	};

	const activatePlugin = async () => {
		if ( ! pluginSlug ) {
			return;
		}
		setIsBusy( true );
		try {
			await saveEntityRecord(
				'root',
				'plugin',
				{ plugin: `${ pluginSlug }/plugin`, status: 'active' },
				{ throwOnError: true }
			);
			setPluginStatusOverride( 'active' );
			// Re-fetch settings since the activated plugin may register new settings.
			invalidateResolution( 'getEntityRecord', [ 'root', 'site' ] );
			setIsExpanded( true );
		} catch {
			// Handle error
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
		if ( isCheckingConnection ) {
			return __( 'Checking…' );
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
			const updatedRecord = await saveEntityRecord(
				'root',
				'site',
				{ [ settingName ]: apiKey },
				{ throwOnError: true }
			);

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
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to save API key:', error );
			throw error;
		}
	};

	const removeApiKey = async () => {
		try {
			await saveEntityRecord(
				'root',
				'site',
				{ [ settingName ]: '' },
				{ throwOnError: true }
			);
			// Store auto-updates; currentApiKey reactively becomes ''.
			setConnectedState( false );
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to remove API key:', error );
			throw error;
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
		isCheckingConnection,
		currentApiKey,
		keySource,
		handleButtonClick,
		getButtonLabel,
		saveApiKey,
		removeApiKey,
	};
}
