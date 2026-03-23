/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack, Button } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import {
	__experimentalRegisterConnector as registerConnector,
	__experimentalConnectorItem as ConnectorItem,
	__experimentalDefaultConnectorSettings as DefaultConnectorSettings,
	type ConnectorConfig,
	type ConnectorRenderProps,
} from '@wordpress/connectors';
import { __ } from '@wordpress/i18n';
import { Badge } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useConnectorPlugin } from './use-connector-plugin';
import {
	OpenAILogo,
	ClaudeLogo,
	GeminiLogo,
	DefaultConnectorLogo,
} from './logos';

interface ConnectorData {
	name: string;
	description: string;
	logoUrl?: string;
	type: 'ai_provider';
	plugin?: {
		slug: string;
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
	const pluginSlug = plugin?.slug;

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
		pluginSlug,
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

	const sanitize = ( s: string ) => s.replace( /[^a-z0-9-]/gi, '-' );

	for ( const [ connectorId, data ] of Object.entries( connectors ) ) {
		const { authentication } = data;

		if (
			data.type !== 'ai_provider' ||
			authentication.method !== 'api_key'
		) {
			continue;
		}

		const connectorName = `${ sanitize( data.type ) }/${ sanitize(
			connectorId
		) }`;
		registerConnector( connectorName, {
			name: data.name,
			description: data.description,
			logo: getConnectorLogo( connectorId, data.logoUrl ),
			authentication,
			plugin: data.plugin,
			render: ApiKeyConnector,
		} );
	}
}
