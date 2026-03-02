/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack, Button } from '@wordpress/components';
import {
	__experimentalRegisterConnector as registerConnector,
	__experimentalConnectorItem as ConnectorItem,
	__experimentalDefaultConnectorSettings as DefaultConnectorSettings,
	type ConnectorRenderProps,
} from '@wordpress/connectors';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useConnectorPlugin } from './use-connector-plugin';
import { OpenAILogo, ClaudeLogo, GeminiLogo } from './logos';

interface ProviderData {
	name: string;
	description: string;
	credentialsUrl: string | null;
	authenticationMethod: 'api_key' | 'none';
	settings: string[];
}

/**
 * Reads provider data passed from PHP via the script module data mechanism.
 */
function getProviderData(): Record< string, ProviderData > {
	try {
		const parsed = JSON.parse(
			document.getElementById(
				'wp-script-module-data-connectors-wp-admin'
			)?.textContent ?? ''
		);
		return parsed?.providers ?? {};
	} catch {
		return {};
	}
}

const PROVIDER_LOGOS: Record< string, React.ComponentType > = {
	google: GeminiLogo,
	openai: OpenAILogo,
	anthropic: ClaudeLogo,
};

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

interface ApiKeyConnectorConfig {
	pluginSlug: string;
	settingName: string;
	helpUrl?: string;
	helpLabel?: string;
	Logo?: React.ComponentType;
}

function ApiKeyProviderConnector( {
	label,
	description,
	pluginSlug,
	settingName,
	helpUrl,
	helpLabel,
	Logo,
}: ConnectorRenderProps & ApiKeyConnectorConfig ) {
	const {
		pluginStatus,
		isExpanded,
		setIsExpanded,
		isBusy,
		isConnected,
		currentApiKey,
		handleButtonClick,
		getButtonLabel,
		saveApiKey,
		removeApiKey,
	} = useConnectorPlugin( {
		pluginSlug,
		settingName,
	} );

	return (
		<ConnectorItem
			className={ `connector-item--${ pluginSlug }` }
			icon={ Logo ? <Logo /> : undefined }
			name={ label }
			description={ description }
			actionArea={
				<HStack spacing={ 3 } expanded={ false }>
					{ isConnected && <ConnectedBadge /> }
					<Button
						variant={
							isExpanded || isConnected ? 'tertiary' : 'secondary'
						}
						size={
							isExpanded || isConnected ? undefined : 'compact'
						}
						onClick={ handleButtonClick }
						disabled={ pluginStatus === 'checking' || isBusy }
						isBusy={ isBusy }
						aria-expanded={ isExpanded }
					>
						{ getButtonLabel() }
					</Button>
				</HStack>
			}
		>
			{ isExpanded && pluginStatus === 'active' && (
				<DefaultConnectorSettings
					key={ isConnected ? 'connected' : 'setup' }
					initialValue={ currentApiKey }
					helpUrl={ helpUrl }
					helpLabel={ helpLabel }
					readOnly={ isConnected }
					onRemove={ removeApiKey }
					onSave={ async ( apiKey: string ) => {
						await saveApiKey( apiKey );
						setIsExpanded( false );
					} }
				/>
			) }
		</ConnectorItem>
	);
}

// Register connectors from server-provided provider data.
export function registerDefaultConnectors() {
	const providers = getProviderData();

	for ( const [ providerId, data ] of Object.entries( providers ) ) {
		if ( data.authenticationMethod !== 'api_key' ) {
			continue;
		}

		const settingName = data.settings[ 0 ];
		if ( ! settingName ) {
			continue;
		}

		const helpLabel = data.credentialsUrl
			?.replace( /^https?:\/\//, '' )
			.replace( /\/$/, '' );

		registerConnector( `core/${ providerId }`, {
			label: data.name,
			description: data.description,
			render: ( props: ConnectorRenderProps ) => (
				<ApiKeyProviderConnector
					{ ...props }
					pluginSlug={ `ai-provider-for-${ providerId }` }
					settingName={ settingName }
					helpUrl={ data.credentialsUrl ?? undefined }
					helpLabel={ helpLabel }
					Logo={ PROVIDER_LOGOS[ providerId ] }
				/>
			),
		} );
	}
}
