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
import { __, sprintf } from '@wordpress/i18n';

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
	validate?: ( value: string ) => string | undefined;
}

interface KeyValidationRule {
	prefix: string;
	pattern: RegExp;
	minLength: number;
	exactLength?: number;
}

function createKeyValidator( providerName: string, rule: KeyValidationRule ) {
	return ( value: string ): string | undefined => {
		if ( ! value.startsWith( rule.prefix ) ) {
			return rule.exactLength
				? sprintf(
						/* translators: 1: provider name, 2: key prefix, 3: number of characters */
						__(
							'%1$s API keys start with "%2$s" and are %3$d characters long.'
						),
						providerName,
						rule.prefix,
						rule.exactLength
				  )
				: sprintf(
						/* translators: 1: provider name, 2: key prefix, 3: minimum number of characters */
						__(
							'%1$s API keys start with "%2$s" and are at least %3$d characters long.'
						),
						providerName,
						rule.prefix,
						rule.minLength
				  );
		}
		if ( ! rule.pattern.test( value ) ) {
			return rule.exactLength
				? sprintf(
						/* translators: 1: provider name, 2: number of characters */
						__( '%1$s API keys are %2$d characters long.' ),
						providerName,
						rule.exactLength
				  )
				: sprintf(
						/* translators: 1: provider name, 2: minimum number of characters */
						__(
							'%1$s API keys are at least %2$d characters long.'
						),
						providerName,
						rule.minLength
				  );
		}
		return undefined;
	};
}

const validateOpenAIKey = createKeyValidator( 'OpenAI', {
	prefix: 'sk-',
	pattern: /^sk-(proj-|svcacct-|admin-)?[A-Za-z0-9_-]{20,}/,
	minLength: 40,
} );

const validateAnthropicKey = createKeyValidator( 'Anthropic', {
	prefix: 'sk-ant-',
	pattern: /^sk-ant-[a-zA-Z0-9_-]{20,}/,
	minLength: 40,
} );

const validateGeminiKey = createKeyValidator( 'Gemini', {
	prefix: 'AIza',
	pattern: /^AIza[A-Za-z0-9_-]{35}$/,
	minLength: 39,
	exactLength: 39,
} );

function ProviderConnector( {
	label,
	description,
	pluginSlug,
	settingName,
	helpUrl,
	helpLabel,
	Logo,
	validate,
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
					validate={ validate }
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
			settingName="connectors_openai_api_key"
			helpUrl="https://platform.openai.com"
			helpLabel="platform.openai.com"
			Logo={ OpenAILogo }
			validate={ validateOpenAIKey }
		/>
	);
}

// Claude connector render component
function ClaudeConnector( props: ConnectorRenderProps ) {
	return (
		<ProviderConnector
			{ ...props }
			pluginSlug="ai-provider-for-anthropic"
			settingName="connectors_anthropic_api_key"
			helpUrl="https://console.anthropic.com"
			helpLabel="console.anthropic.com"
			Logo={ ClaudeLogo }
			validate={ validateAnthropicKey }
		/>
	);
}

// Gemini connector render component
function GeminiConnector( props: ConnectorRenderProps ) {
	return (
		<ProviderConnector
			{ ...props }
			pluginSlug="ai-provider-for-google"
			settingName="connectors_gemini_api_key"
			helpUrl="https://aistudio.google.com"
			helpLabel="aistudio.google.com"
			Logo={ GeminiLogo }
			validate={ validateGeminiKey }
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
