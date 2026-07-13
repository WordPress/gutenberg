/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack, Button } from '@wordpress/components';
import { useRef } from '@wordpress/element';
import {
	__experimentalRegisterConnector as registerConnector,
	__experimentalConnectorItem as ConnectorItem,
	__experimentalDefaultConnectorSettings as DefaultConnectorSettings,
	__experimentalApplicationPasswordConnectorSettings as ApplicationPasswordConnectorSettings,
	privateApis as connectorsPrivateApis,
	type ConnectorConfig,
	type ConnectorRenderProps,
} from '@wordpress/connectors';
import { select } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { Badge, Link } from '@wordpress/ui';
import { unlock } from '@wordpress/routes-lock-unlock';

/**
 * Internal dependencies
 */
import { useConnectorPlugin, type PluginStatus } from './use-connector-plugin';
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

interface ConnectorScriptModuleData {
	connectors?: Record< string, ConnectorData >;
	isFileModDisabled?: boolean;
}

function getConnectorScriptModuleData(): ConnectorScriptModuleData {
	try {
		return JSON.parse(
			document.getElementById(
				'wp-script-module-data-options-connectors-wp-admin'
			)?.textContent ?? '{}'
		);
	} catch {
		return {};
	}
}

/**
 * Reads connector data passed from PHP via the script module data mechanism.
 */
export function getConnectorData(): Record< string, ConnectorData > {
	return getConnectorScriptModuleData().connectors ?? {};
}

export function getIsFileModDisabled(): boolean {
	return !! getConnectorScriptModuleData().isFileModDisabled;
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
			fontWeight: 'var(--wpds-typography-font-weight-emphasis)',
			whiteSpace: 'nowrap',
		} }
	>
		{ __( 'Connected' ) }
	</span>
);

const PluginDirectoryLink = ( { slug }: { slug: string } ) => (
	<Link
		href={ sprintf(
			/* translators: %s: plugin slug. */
			__( 'https://wordpress.org/plugins/%s/' ),
			slug
		) }
		openInNewTab
	>
		{ __( 'Learn more' ) }
	</Link>
);

const UnavailableActionBadge = () => <Badge>{ __( 'Not available' ) }</Badge>;

interface ConnectorActionAreaProps {
	isConnected: boolean;
	showUnavailableBadge: boolean;
	pluginSlug?: string;
	isExpanded: boolean;
	isBusy: boolean;
	pluginStatus: PluginStatus;
	actionButtonRef: {
		current: HTMLButtonElement | null;
	};
	handleButtonClick: () => void;
	getButtonLabel: () => string;
}

function ConnectorActionArea( {
	isConnected,
	showUnavailableBadge,
	pluginSlug,
	isExpanded,
	isBusy,
	pluginStatus,
	actionButtonRef,
	handleButtonClick,
	getButtonLabel,
}: ConnectorActionAreaProps ) {
	return (
		<HStack spacing={ 3 } expanded={ false }>
			{ isConnected && <ConnectedBadge /> }
			{ showUnavailableBadge &&
				( pluginSlug ? (
					<PluginDirectoryLink slug={ pluginSlug } />
				) : (
					<UnavailableActionBadge />
				) ) }
			{ ! showUnavailableBadge && (
				<Button
					ref={ actionButtonRef }
					variant={
						isExpanded || isConnected ? 'tertiary' : 'secondary'
					}
					size="compact"
					onClick={ handleButtonClick }
					disabled={ pluginStatus === 'checking' || isBusy }
					isBusy={ isBusy }
					accessibleWhenDisabled
				>
					{ getButtonLabel() }
				</Button>
			) }
		</HStack>
	);
}

function getPluginSlug( pluginFile?: string ) {
	const pluginBasename = pluginFile?.replace( /\.php$/, '' );
	return pluginBasename?.includes( '/' )
		? pluginBasename.split( '/' )[ 0 ]
		: pluginBasename;
}

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
	const pluginSlug = getPluginSlug( plugin?.file );

	const {
		pluginStatus,
		canInstallPlugins,
		canActivatePlugins,
		isExpanded,
		setIsExpanded,
		isBusy,
		isConnected,
		currentApiKey,
		hasResolvedSettings,
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

	const actionButtonRef = useRef< HTMLButtonElement >( null );

	return (
		<ConnectorItem
			className={
				pluginSlug ? `connector-item--${ pluginSlug }` : undefined
			}
			logo={ logo }
			name={ name }
			description={ description }
			actionArea={
				<ConnectorActionArea
					isConnected={ isConnected }
					showUnavailableBadge={ showUnavailableBadge }
					pluginSlug={ pluginSlug }
					isExpanded={ isExpanded }
					isBusy={ isBusy }
					pluginStatus={ pluginStatus }
					actionButtonRef={ actionButtonRef }
					handleButtonClick={ handleButtonClick }
					getButtonLabel={ getButtonLabel }
				/>
			}
		>
			{ isExpanded &&
				pluginStatus === 'active' &&
				hasResolvedSettings && (
					<DefaultConnectorSettings
						key={ isConnected ? 'connected' : 'setup' }
						initialValue={
							isExternallyConfigured
								? '••••••••••••••••'
								: currentApiKey
						}
						helpUrl={ helpUrl }
						readOnly={ isConnected || isExternallyConfigured }
						keySource={ keySource }
						onRemove={
							isExternallyConfigured
								? undefined
								: async () => {
										await removeApiKey();
										actionButtonRef.current?.focus();
								  }
						}
						onSave={ async ( apiKey: string ) => {
							await saveApiKey( apiKey );
							setIsExpanded( false );
							actionButtonRef.current?.focus();
						} }
					/>
				) }
		</ConnectorItem>
	);
}

function ApplicationPasswordConnector( {
	name,
	description,
	logo,
	authentication,
	plugin,
}: ConnectorRenderProps ) {
	const auth =
		authentication?.method === 'application_password'
			? authentication
			: undefined;
	const settingName = auth?.settingName ?? '';
	const helpUrl = auth?.credentialsUrl ?? undefined;
	const pluginSlug = getPluginSlug( plugin?.file );

	const {
		pluginStatus,
		canInstallPlugins,
		canActivatePlugins,
		isExpanded,
		setIsExpanded,
		isBusy,
		isConnected,
		currentUsername,
		hasResolvedSettings,
		keySource,
		handleButtonClick,
		getButtonLabel,
		saveCredentials,
		removeCredentials,
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

	const actionButtonRef = useRef< HTMLButtonElement >( null );
	const showUnavailableBadge =
		( pluginStatus === 'not-installed' && canInstallPlugins === false ) ||
		( pluginStatus === 'inactive' && canActivatePlugins === false );

	return (
		<ConnectorItem
			className={
				pluginSlug ? `connector-item--${ pluginSlug }` : undefined
			}
			logo={ logo }
			name={ name }
			description={ description }
			actionArea={
				<ConnectorActionArea
					isConnected={ isConnected }
					showUnavailableBadge={ showUnavailableBadge }
					pluginSlug={ pluginSlug }
					isExpanded={ isExpanded }
					isBusy={ isBusy }
					pluginStatus={ pluginStatus }
					actionButtonRef={ actionButtonRef }
					handleButtonClick={ handleButtonClick }
					getButtonLabel={ getButtonLabel }
				/>
			}
		>
			{ isExpanded &&
				pluginStatus === 'active' &&
				hasResolvedSettings && (
					<ApplicationPasswordConnectorSettings
						key={ isConnected ? 'connected' : 'setup' }
						initialUsername={
							isExternallyConfigured
								? '••••••••••••••••'
								: currentUsername
						}
						helpUrl={ helpUrl }
						readOnly={ isConnected || isExternallyConfigured }
						keySource={ keySource }
						onRemove={
							isExternallyConfigured
								? undefined
								: async () => {
										await removeCredentials();
										actionButtonRef.current?.focus();
								  }
						}
						onSave={ async ( credentials ) => {
							await saveCredentials( credentials );
							setIsExpanded( false );
							actionButtonRef.current?.focus();
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
		} else if (
			authentication.method === 'application_password' &&
			! existing?.render
		) {
			args.render = ApplicationPasswordConnector;
		}

		registerConnector( connectorName, args );
	}
}
