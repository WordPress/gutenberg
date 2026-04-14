/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack, Button } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import {
	__experimentalRegisterConnector as registerConnector,
	__experimentalConnectorItem as ConnectorItem,
	__experimentalDefaultConnectorSettings as DefaultConnectorSettings,
	privateApis as connectorsPrivateApis,
	type ConnectorConfig,
	type ConnectorRenderProps,
} from '@wordpress/connectors';
import { select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Badge } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import { useConnectorPlugin } from './use-connector-plugin';
import {
	OpenAILogo,
	ClaudeLogo,
	GeminiLogo,
	AkismetLogo,
	DefaultConnectorLogo,
} from './logos';

const { store: connectorsStore } = unlock( connectorsPrivateApis );

interface ConnectorData {
	name: string;
	description: string;
	logoUrl?: string;
	type: string;
	plugin?: {
		file: string;
		isInstalled: boolean;
		isActivated: boolean;
	};
	authentication: NonNullable< ConnectorConfig[ 'authentication' ] >;
}

/**
 * Reads connector data passed from PHP via the script module data mechanism.
 */
export function getConnectorData(): Record< string, ConnectorData > {
	try {
		const parsed = JSON.parse(
			document.getElementById(
				'wp-script-module-data-options-connectors-wp-admin'
			)?.textContent ?? ''
		);
		return parsed?.connectors ?? {};
	} catch {
		return {};
	}
}

const CONNECTOR_LOGOS: Record< string, React.ComponentType > = {
	google: GeminiLogo,
	openai: OpenAILogo,
	anthropic: ClaudeLogo,
	akismet: AkismetLogo,
};

function getConnectorLogo(
	connectorId: string,
	logoUrl?: string
): React.ReactNode {
	if ( logoUrl ) {
		return <img src={ logoUrl } alt="" width={ 40 } height={ 40 } />;
	}
	const Logo = CONNECTOR_LOGOS[ connectorId ];
	if ( Logo ) {
		return <Logo />;
	}
	return <DefaultConnectorLogo />;
}

const ConnectedBadge = () => (
	<span
		style={ {
			color: '#345b37',
			backgroundColor: '#eff8f0',
			padding: '4px 12px',
			borderRadius: '2px',
			fontSize: '13px',
			fontWeight: 500,
			whiteSpace: 'nowrap',
		} }
	>
		{ __( 'Connected' ) }
	</span>
);

const UnavailableActionBadge = () => <Badge>{ __( 'Not available' ) }</Badge>;

function ApiKeyConnector( {
	name,
	description,
	logo,
	authentication,
	plugin,
}: ConnectorRenderProps ) {
	const auth =
		authentication?.method === 'api_key' ? authentication : undefined;
	const settingName = auth?.settingName ?? '';
	const helpUrl = auth?.credentialsUrl ?? undefined;
	const pluginFile = plugin?.file?.replace( /\.php$/, '' );
	const pluginSlug = pluginFile?.includes( '/' )
		? pluginFile.split( '/' )[ 0 ]
		: pluginFile;

	let helpLabel: string | undefined;
	try {
		if ( helpUrl ) {
			helpLabel = new URL( helpUrl ).hostname;
		}
	} catch {
		// Invalid URL — leave helpLabel undefined.
	}

	const {
		pluginStatus,
		canInstallPlugins,
		canActivatePlugins,
		isExpanded,
		setIsExpanded,
		isBusy,
		isConnected,
		currentApiKey,
		keySource,
		handleButtonClick,
		getButtonLabel,
		saveApiKey,
		removeApiKey,
	} = useConnectorPlugin( {
		file: plugin?.file,
		settingName,
		connectorName: name,
		isInstalled: plugin?.isInstalled,
		isActivated: plugin?.isActivated,
		keySource: auth?.keySource,
		initialIsConnected: auth?.isConnected,
	} );
	const isExternallyConfigured =
		keySource === 'env' || keySource === 'constant';
	const showUnavailableBadge =
		( pluginStatus === 'not-installed' && canInstallPlugins === false ) ||
		( pluginStatus === 'inactive' && canActivatePlugins === false );
	const showActionButton = ! showUnavailableBadge;

	const actionButtonRef = useRef< HTMLButtonElement >( null );
	const pendingFocusRef = useRef( false );

	// Restore focus to the action button after async actions complete.
	useEffect( () => {
		if ( pendingFocusRef.current && ! isBusy ) {
			pendingFocusRef.current = false;
			actionButtonRef.current?.focus();
		}
	}, [ isBusy, isExpanded, isConnected ] );

	const handleActionClick = () => {
		if ( pluginStatus === 'not-installed' || pluginStatus === 'inactive' ) {
			pendingFocusRef.current = true;
		}
		handleButtonClick();
	};

	return (
		<ConnectorItem
			className={
				pluginSlug ? `connector-item--${ pluginSlug }` : undefined
			}
			logo={ logo }
			name={ name }
			description={ description }
			actionArea={
				<HStack spacing={ 3 } expanded={ false }>
					{ isConnected && <ConnectedBadge /> }
					{ showUnavailableBadge && <UnavailableActionBadge /> }
					{ showActionButton && (
						<Button
							ref={ actionButtonRef }
							variant={
								isExpanded || isConnected
									? 'tertiary'
									: 'secondary'
							}
							size="compact"
							onClick={ handleActionClick }
							disabled={ pluginStatus === 'checking' || isBusy }
							isBusy={ isBusy }
						>
							{ getButtonLabel() }
						</Button>
					) }
				</HStack>
			}
		>
			{ isExpanded && pluginStatus === 'active' && (
				<DefaultConnectorSettings
					key={ isConnected ? 'connected' : 'setup' }
					initialValue={
						isExternallyConfigured
							? '••••••••••••••••'
							: currentApiKey
					}
					helpUrl={ helpUrl }
					helpLabel={ helpLabel }
					readOnly={ isConnected || isExternallyConfigured }
					keySource={ keySource }
					onRemove={
						isExternallyConfigured
							? undefined
							: async () => {
									pendingFocusRef.current = true;
									try {
										await removeApiKey();
									} catch {
										pendingFocusRef.current = false;
									}
							  }
					}
					onSave={ async ( apiKey: string ) => {
						await saveApiKey( apiKey );
						pendingFocusRef.current = true;
						setIsExpanded( false );
					} }
				/>
			) }
		</ConnectorItem>
	);
}

// Register connectors from server-provided connector data.
export function registerDefaultConnectors() {
	const connectors = getConnectorData();

	const sanitize = ( s: string ) => s.replace( /[^a-z0-9-_]/gi, '-' );

	for ( const [ connectorId, data ] of Object.entries( connectors ) ) {
		// Special case: Hide Akismet unless it is already installed.
		// See https://core.trac.wordpress.org/ticket/65012
		if ( connectorId === 'akismet' && ! data.plugin?.isInstalled ) {
			continue;
		}

		const { authentication } = data;

		const connectorName = sanitize( connectorId );
		const args: Partial< Omit< ConnectorConfig, 'slug' > > = {
			name: data.name,
			description: data.description,
			type: data.type,
			logo: getConnectorLogo( connectorId, data.logoUrl ),
			authentication,
			plugin: data.plugin,
		};

		// Preserve a render that was already registered for this slug by
		// another caller. Omitting `render` from `args` leaves the existing
		// render in place while the server-side metadata still merges on top.
		const existing = unlock( select( connectorsStore ) ).getConnector(
			connectorName
		);
		if ( authentication.method === 'api_key' && ! existing?.render ) {
			args.render = ApiKeyConnector;
		}

		registerConnector( connectorName, args );
	}
}
