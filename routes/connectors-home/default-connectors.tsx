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

interface ConnectorConfig {
	pluginSlug: string;
	settingName: string;
	helpUrl: string;
	helpLabel: string;
	Logo: React.ComponentType;
}

function ProviderConnector( {
	label,
	description,
	pluginSlug,
	settingName,
	helpUrl,
	helpLabel,
	Logo,
}: ConnectorRenderProps & ConnectorConfig ) {
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
			icon={ <Logo /> }
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

// OpenAI connector render component
function OpenAIConnector( props: ConnectorRenderProps ) {
	return (
		<ProviderConnector
			{ ...props }
			pluginSlug="ai-provider-for-openai"
			settingName="connectors_ai_openai_api_key"
			helpUrl="https://platform.openai.com"
			helpLabel="platform.openai.com"
			Logo={ OpenAILogo }
		/>
	);
}

// Claude connector render component
function ClaudeConnector( props: ConnectorRenderProps ) {
	return (
		<ProviderConnector
			{ ...props }
			pluginSlug="ai-provider-for-anthropic"
			settingName="connectors_ai_anthropic_api_key"
			helpUrl="https://console.anthropic.com"
			helpLabel="console.anthropic.com"
			Logo={ ClaudeLogo }
		/>
	);
}

// Gemini connector render component
function GeminiConnector( props: ConnectorRenderProps ) {
	return (
		<ProviderConnector
			{ ...props }
			pluginSlug="ai-provider-for-google"
			settingName="connectors_ai_google_api_key"
			helpUrl="https://aistudio.google.com"
			helpLabel="aistudio.google.com"
			Logo={ GeminiLogo }
		/>
	);
}

// Register built-in connectors
export function registerDefaultConnectors() {
	registerConnector( 'core/openai', {
		label: __( 'OpenAI' ),
		description: __(
			'Text, image, and code generation with GPT and DALL-E.'
		),
		render: OpenAIConnector,
	} );

	registerConnector( 'core/claude', {
		label: __( 'Claude' ),
		description: __( 'Writing, research, and analysis with Claude.' ),
		render: ClaudeConnector,
	} );

	registerConnector( 'core/gemini', {
		label: __( 'Gemini' ),
		description: __(
			"Content generation, translation, and vision with Google's Gemini."
		),
		render: GeminiConnector,
	} );
}
