/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/components';
import {
	registerConnector,
	ConnectorItem,
	DefaultConnectorSettings,
	type ConnectorRenderProps,
} from '@wordpress/connectors';
import { useState, useEffect } from '@wordpress/element';
import { chevronUp, chevronDown } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

// OpenAI logo as inline SVG
const OpenAILogo = () => (
	<svg
		width="32"
		height="32"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364l2.0201-1.1685a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4043-.6813zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"
			fill="currentColor"
		/>
	</svg>
);

// Claude/Anthropic logo as inline SVG
const ClaudeLogo = () => (
	<svg
		width="32"
		height="32"
		viewBox="0 0 32 32"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M6.2 21.024L12.416 17.536L12.52 17.232L12.416 17.064H12.112L11.072 17L7.52 16.904L4.44 16.776L1.456 16.616L0.704 16.456L0 15.528L0.072 15.064L0.704 14.64L1.608 14.72L3.608 14.856L6.608 15.064L8.784 15.192L12.008 15.528H12.52L12.592 15.32L12.416 15.192L12.28 15.064L9.176 12.96L5.816 10.736L4.056 9.456L3.104 8.808L2.624 8.2L2.416 6.872L3.28 5.92L4.44 6L4.736 6.08L5.912 6.984L8.424 8.928L11.704 11.344L12.184 11.744L12.376 11.608L12.4 11.512L12.184 11.152L10.4 7.928L8.496 4.648L7.648 3.288L7.424 2.472C7.344 2.136 7.288 1.856 7.288 1.512L8.272 0.176L8.816 0L10.128 0.176L10.68 0.656L11.496 2.52L12.816 5.456L14.864 9.448L15.464 10.632L15.784 11.728L15.904 12.064H16.112V11.872L16.28 9.624L16.592 6.864L16.896 3.312L17 2.312L17.496 1.112L18.48 0.464L19.248 0.832L19.88 1.736L19.792 2.32L19.416 4.76L18.68 8.584L18.2 11.144H18.48L18.8 10.824L20.096 9.104L22.272 6.384L23.232 5.304L24.352 4.112L25.072 3.544H26.432L27.432 5.032L26.984 6.568L25.584 8.344L24.424 9.848L22.76 12.088L21.72 13.88L21.816 14.024L22.064 14L25.824 13.2L27.856 12.832L30.28 12.416L31.376 12.928L31.496 13.448L31.064 14.512L28.472 15.152L25.432 15.76L20.904 16.832L20.848 16.872L20.912 16.952L22.952 17.144L23.824 17.192H25.96L29.936 17.488L30.976 18.176L31.6 19.016L31.496 19.656L29.896 20.472L27.736 19.96L22.696 18.76L20.968 18.328H20.728V18.472L22.168 19.88L24.808 22.264L28.112 25.336L28.28 26.096L27.856 26.696L27.408 26.632L24.504 24.448L23.384 23.464L20.848 21.328H20.68V21.552L21.264 22.408L24.352 27.048L24.512 28.472L24.288 28.936L23.488 29.216L22.608 29.056L20.8 26.52L18.936 23.664L17.432 21.104L17.248 21.208L16.36 30.768L15.944 31.256L14.984 31.624L14.184 31.016L13.76 30.032L14.184 28.088L14.696 25.552L15.112 23.536L15.488 21.032L15.712 20.2L15.696 20.144L15.512 20.168L13.624 22.76L10.752 26.64L8.48 29.072L7.936 29.288L6.992 28.8L7.08 27.928L7.608 27.152L10.752 23.152L12.648 20.672L13.872 19.24L13.864 19.032H13.792L5.44 24.456L3.952 24.648L3.312 24.048L3.392 23.064L3.696 22.744L6.208 21.016L6.2 21.024Z"
			fill="#D97757"
		/>
	</svg>
);

// Gemini logo as inline SVG
const GeminiLogo = () => (
	<svg
		width="32"
		height="32"
		viewBox="-3 0 262 262"
		xmlns="http://www.w3.org/2000/svg"
		preserveAspectRatio="xMidYMid"
	>
		<path
			d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
			fill="#4285F4"
		/>
		<path
			d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
			fill="#34A853"
		/>
		<path
			d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
			fill="#FBBC05"
		/>
		<path
			d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
			fill="#EB4335"
		/>
	</svg>
);

// OpenAI connector render component
function OpenAIConnector( { label, description }: ConnectorRenderProps ) {
	const [ isExpanded, setIsExpanded ] = useState( false );

	return (
		<ConnectorItem
			icon={ <OpenAILogo /> }
			name={ label }
			description={ description }
			actionArea={
				<Button
					variant="secondary"
					size="compact"
					icon={ isExpanded ? chevronUp : chevronDown }
					iconPosition="right"
					onClick={ () => setIsExpanded( ! isExpanded ) }
					aria-expanded={ isExpanded }
				>
					{ isExpanded ? __( 'Close' ) : __( 'Install' ) }
				</Button>
			}
		>
			{ isExpanded && (
				<DefaultConnectorSettings
					onSave={ ( apiKey: string ) => {
						// eslint-disable-next-line no-console
						console.log( 'Saving OpenAI API key:', apiKey );
					} }
					onCancel={ () => setIsExpanded( false ) }
				/>
			) }
		</ConnectorItem>
	);
}

// Claude connector render component
function ClaudeConnector( { label, description }: ConnectorRenderProps ) {
	const [ isExpanded, setIsExpanded ] = useState( false );

	return (
		<ConnectorItem
			icon={ <ClaudeLogo /> }
			name={ label }
			description={ description }
			actionArea={
				<Button
					variant="secondary"
					size="compact"
					icon={ isExpanded ? chevronUp : chevronDown }
					iconPosition="right"
					onClick={ () => setIsExpanded( ! isExpanded ) }
					aria-expanded={ isExpanded }
				>
					{ isExpanded ? __( 'Close' ) : __( 'Install' ) }
				</Button>
			}
		>
			{ isExpanded && (
				<DefaultConnectorSettings
					onSave={ ( apiKey: string ) => {
						// eslint-disable-next-line no-console
						console.log( 'Saving Claude API key:', apiKey );
					} }
					onCancel={ () => setIsExpanded( false ) }
				/>
			) }
		</ConnectorItem>
	);
}

type PluginStatus = 'checking' | 'not-installed' | 'inactive' | 'active';

// Gemini connector render component
function GeminiConnector( { label, description }: ConnectorRenderProps ) {
	const [ pluginStatus, setPluginStatus ] =
		useState< PluginStatus >( 'checking' );
	const [ isExpanded, setIsExpanded ] = useState( false );
	const [ isBusy, setIsBusy ] = useState( false );
	const [ currentApiKey, setCurrentApiKey ] = useState( '' );

	// Fetch the current API key
	const fetchApiKey = async () => {
		try {
			const settings = await apiFetch< {
				connectors_gemini_api_key?: string;
			} >( {
				path: '/wp/v2/settings',
			} );
			setCurrentApiKey( settings.connectors_gemini_api_key || '' );
		} catch {
			// Ignore errors
		}
	};

	// Check plugin status on mount
	useEffect( () => {
		const checkPluginStatus = async () => {
			try {
				const plugins = await apiFetch<
					Array< { plugin: string; status: string } >
				>( {
					path: '/wp/v2/plugins',
				} );

				const googleAiPlugin = plugins.find(
					( p ) => p.plugin === 'ai-provider-for-google/plugin'
				);

				if ( ! googleAiPlugin ) {
					setPluginStatus( 'not-installed' );
				} else if ( googleAiPlugin.status === 'active' ) {
					setPluginStatus( 'active' );
					// Fetch API key when plugin is active
					fetchApiKey();
				} else {
					setPluginStatus( 'inactive' );
				}
			} catch {
				// If we can't check, assume not installed
				setPluginStatus( 'not-installed' );
			}
		};

		checkPluginStatus();
	}, [] );

	const installPlugin = async () => {
		setIsBusy( true );
		try {
			await apiFetch( {
				method: 'POST',
				path: '/wp/v2/plugins',
				data: { slug: 'ai-provider-for-google', status: 'active' },
			} );
			setPluginStatus( 'active' );
			setIsExpanded( true );
		} catch {
			// Handle error (could show notice)
		} finally {
			setIsBusy( false );
		}
	};

	const activatePlugin = async () => {
		setIsBusy( true );
		try {
			await apiFetch( {
				method: 'PUT',
				path: '/wp/v2/plugins/ai-provider-for-google/plugin',
				data: { status: 'active' },
			} );
			setPluginStatus( 'active' );
			setIsExpanded( true );
		} catch {
			// Handle error
		} finally {
			setIsBusy( false );
		}
	};

	const handleButtonClick = () => {
		if ( pluginStatus === 'not-installed' ) {
			installPlugin();
		} else if ( pluginStatus === 'inactive' ) {
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
			return __( 'Close' );
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

	return (
		<ConnectorItem
			icon={ <GeminiLogo /> }
			name={ label }
			description={ description }
			actionArea={
				<Button
					variant="secondary"
					size="compact"
					icon={
						pluginStatus === 'active' && isExpanded
							? chevronUp
							: undefined
					}
					iconPosition="right"
					onClick={ handleButtonClick }
					disabled={ pluginStatus === 'checking' || isBusy }
					isBusy={ isBusy }
					aria-expanded={ isExpanded }
				>
					{ getButtonLabel() }
				</Button>
			}
		>
			{ isExpanded && pluginStatus === 'active' && (
				<DefaultConnectorSettings
					initialValue={ currentApiKey }
					onSave={ async ( apiKey: string ) => {
						try {
							await apiFetch( {
								method: 'POST',
								path: '/wp/v2/settings',
								data: {
									connectors_gemini_api_key: apiKey,
								},
							} );
							setCurrentApiKey( apiKey );
							setIsExpanded( false );
						} catch ( error ) {
							// eslint-disable-next-line no-console
							console.error( 'Failed to save API key:', error );
						}
					} }
					onCancel={ () => setIsExpanded( false ) }
				/>
			) }
		</ConnectorItem>
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
