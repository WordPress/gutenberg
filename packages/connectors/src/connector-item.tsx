/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalItem as Item,
	__experimentalText as WCText,
	ExternalLink,
	FlexBlock,
	Button,
	TextControl,
} from '@wordpress/components';
import { createInterpolateElement, useId, useState } from '@wordpress/element';
import { __, sprintf, type TransformedText } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { ReactNode } from 'react';
import type { ApiKeySource } from './types';

export interface ConnectorItemProps {
	className?: string;
	logo?: ReactNode;
	name: string;
	description: string;
	actionArea?: ReactNode;
	children?: ReactNode;
}

export function ConnectorItem( {
	className,
	logo,
	name,
	description,
	actionArea,
	children,
}: ConnectorItemProps ) {
	const headingId = useId();
	return (
		<Item className={ className }>
			<VStack spacing={ 4 } role="group" aria-labelledby={ headingId }>
				<HStack alignment="center" spacing={ 4 } wrap>
					{ logo }
					<FlexBlock>
						<VStack spacing={ 0 }>
							<WCText
								weight="var(--wpds-typography-font-weight-emphasis)"
								size={ 15 }
								id={ headingId }
								as="h2"
							>
								{ name }
							</WCText>
							<WCText variant="muted" size={ 12 }>
								{ description }
							</WCText>
						</VStack>
					</FlexBlock>
					{ actionArea }
				</HStack>
				{ children }
			</VStack>
		</Item>
	);
}

export type { ApiKeySource } from './types';

type ConnectorHelpMessage =
	| `${ string }%s${ string }`
	| TransformedText< `${ string }%s${ string }` >;
type ConnectorHelpInterpolatedMessage = `${ string }<a></a>${ string }`;

function getHelpLinkLabel( helpUrl?: string, helpLabel?: string ) {
	if ( helpLabel ) {
		return helpLabel;
	}
	if ( ! helpUrl ) {
		return undefined;
	}
	try {
		return new URL( helpUrl ).hostname;
	} catch {
		return helpUrl;
	}
}

function createConnectorHelpLink(
	helpUrl: string | undefined,
	helpLabel: string | undefined,
	message: ConnectorHelpMessage
) {
	if ( ! helpUrl ) {
		return undefined;
	}

	return createInterpolateElement(
		sprintf( message, '<a></a>' ) as ConnectorHelpInterpolatedMessage,
		{
			a: (
				<ExternalLink href={ helpUrl }>
					{ getHelpLinkLabel( helpUrl, helpLabel ) }
				</ExternalLink>
			),
		}
	);
}

function useConnectorSettingsSave< TValue >(
	onSave: ( ( value: TValue ) => void | Promise< void > ) | undefined,
	fallbackErrorMessage: string
) {
	const [ isSaving, setIsSaving ] = useState( false );
	const [ saveError, setSaveError ] = useState< string | null >( null );

	const handleSave = async ( value: TValue ) => {
		setSaveError( null );
		setIsSaving( true );
		try {
			await onSave?.( value );
		} catch ( error ) {
			setSaveError(
				error instanceof Error ? error.message : fallbackErrorMessage
			);
		} finally {
			setIsSaving( false );
		}
	};

	return {
		isSaving,
		saveError,
		setSaveError,
		handleSave,
	};
}

function ConnectorSettingsFrame( {
	readOnly,
	children,
}: {
	readOnly: boolean;
	children: ReactNode;
} ) {
	return (
		<VStack
			spacing={ 4 }
			className="connector-settings"
			style={
				readOnly
					? {
							'--wp-components-color-background': '#f0f0f0',
					  }
					: undefined
			}
		>
			{ children }
		</VStack>
	);
}

function ConnectorSettingsFooter( {
	readOnly,
	onRemove,
	canSave,
	isSaving,
	onSave,
}: {
	readOnly: boolean;
	onRemove?: () => void;
	canSave: boolean;
	isSaving: boolean;
	onSave: () => void;
} ) {
	if ( readOnly ) {
		if ( ! onRemove ) {
			return null;
		}

		return (
			<HStack justify="flex-start">
				<Button variant="link" isDestructive onClick={ onRemove }>
					{ __( 'Remove and replace' ) }
				</Button>
			</HStack>
		);
	}

	return (
		<HStack justify="flex-start">
			<Button
				__next40pxDefaultSize
				variant="primary"
				disabled={ ! canSave || isSaving }
				accessibleWhenDisabled
				isBusy={ isSaving }
				onClick={ onSave }
			>
				{ __( 'Save' ) }
			</Button>
		</HStack>
	);
}

export interface DefaultConnectorSettingsProps {
	onSave?: ( apiKey: string ) => void | Promise< void >;
	onRemove?: () => void;
	initialValue?: string;
	helpUrl?: string;
	helpLabel?: string;
	readOnly?: boolean;
	keySource?: ApiKeySource;
}

/**
 * Default settings form for connectors.
 *
 * @param props              - Component props.
 * @param props.onSave       - Callback invoked with the API key when the user saves.
 * @param props.onRemove     - Callback invoked when the user removes the connector.
 * @param props.initialValue - Initial value for the API key field.
 * @param props.helpUrl      - URL to documentation for obtaining an API key.
 * @param props.helpLabel    - Custom label for the help link. Defaults to the URL's hostname.
 * @param props.readOnly     - Whether the form is in read-only mode.
 * @param props.keySource    - The source of the API key: 'env', 'constant', 'database', or 'none'.
 */
export function DefaultConnectorSettings( {
	onSave,
	onRemove,
	initialValue = '',
	helpUrl,
	helpLabel,
	readOnly = false,
	keySource,
}: DefaultConnectorSettingsProps ) {
	const [ apiKey, setApiKey ] = useState( initialValue );
	const { isSaving, saveError, setSaveError, handleSave } =
		useConnectorSettingsSave(
			onSave,
			__(
				'It was not possible to connect to the provider using this key.'
			)
		);

	const helpLink = createConnectorHelpLink(
		helpUrl,
		helpLabel,
		/* translators: %s: Link to provider settings. */
		__( 'Get your API key at %s' )
	);

	const isExternallyConfigured =
		keySource === 'env' || keySource === 'constant';

	const getHelp = () => {
		if ( isExternallyConfigured ) {
			if ( keySource === 'env' ) {
				return __(
					'This API key is configured using an environment variable.'
				);
			}
			if ( keySource === 'constant' ) {
				return __( 'This API key is configured as a constant.' );
			}
		}
		if ( readOnly ) {
			return helpUrl
				? createConnectorHelpLink(
						helpUrl,
						helpLabel,
						/* translators: %s: Link to provider settings. */
						__(
							'Your API key is stored securely. You can manage it at %s'
						)
				  )
				: __( 'Your API key is stored securely.' );
		}
		if ( saveError ) {
			return (
				<span role="alert" className="connector-settings__error">
					{ saveError }
				</span>
			);
		}
		return helpLink;
	};

	return (
		<ConnectorSettingsFrame readOnly={ readOnly }>
			<TextControl
				label={ __( 'API Key' ) }
				value={ apiKey }
				onChange={ ( value ) => {
					if ( ! readOnly ) {
						setSaveError( null );
						setApiKey( value );
					}
				} }
				placeholder={ __( 'Enter your API key' ) }
				disabled={ readOnly || isSaving }
				autoComplete="off"
				help={ getHelp() }
			/>
			<ConnectorSettingsFooter
				readOnly={ readOnly }
				onRemove={ onRemove }
				canSave={ !! apiKey }
				isSaving={ isSaving }
				onSave={ () => handleSave( apiKey ) }
			/>
		</ConnectorSettingsFrame>
	);
}

export interface ApplicationPasswordCredentials {
	username: string;
	applicationPassword: string;
}

export interface ApplicationPasswordConnectorSettingsProps {
	onSave?: (
		credentials: ApplicationPasswordCredentials
	) => void | Promise< void >;
	onRemove?: () => void;
	initialUsername?: string;
	helpUrl?: string;
	helpLabel?: string;
	readOnly?: boolean;
	keySource?: ApiKeySource;
}

/**
 * Default settings form for application password connectors.
 *
 * @param props                 - Component props.
 * @param props.onSave          - Callback invoked with the username and application password.
 * @param props.onRemove        - Callback invoked when the credentials are removed.
 * @param props.initialUsername - Initial value for the username field.
 * @param props.helpUrl         - URL where users can create an application password.
 * @param props.helpLabel       - Custom label for the help link. Defaults to the URL's hostname.
 * @param props.readOnly        - Whether the form is in read-only mode.
 * @param props.keySource       - The source of the credentials: 'env', 'constant', 'database', or 'none'.
 */
export function ApplicationPasswordConnectorSettings( {
	onSave,
	onRemove,
	initialUsername = '',
	helpUrl,
	helpLabel,
	readOnly = false,
	keySource,
}: ApplicationPasswordConnectorSettingsProps ) {
	const [ username, setUsername ] = useState( initialUsername );
	const [ applicationPassword, setApplicationPassword ] = useState( '' );
	const { isSaving, saveError, setSaveError, handleSave } =
		useConnectorSettingsSave< ApplicationPasswordCredentials >(
			onSave,
			__( 'It was not possible to save these credentials.' )
		);

	const help = createConnectorHelpLink(
		helpUrl,
		helpLabel,
		/* translators: %s: Link to the remote site's application passwords screen. */
		__( 'Create an application password at %s' )
	);

	let applicationPasswordHelp: ReactNode = help;
	if ( keySource === 'env' ) {
		applicationPasswordHelp = __(
			'These credentials are configured using an environment variable.'
		);
	} else if ( keySource === 'constant' ) {
		applicationPasswordHelp = __(
			'These credentials are configured as a constant.'
		);
	} else if ( readOnly ) {
		applicationPasswordHelp = __(
			'Your application password is stored securely.'
		);
	}
	if ( saveError ) {
		applicationPasswordHelp = (
			<span role="alert" className="connector-settings__error">
				{ saveError }
			</span>
		);
	}

	return (
		<ConnectorSettingsFrame readOnly={ readOnly }>
			<TextControl
				label={ __( 'Username' ) }
				value={ username }
				onChange={ ( value ) => {
					if ( ! readOnly ) {
						setSaveError( null );
						setUsername( value );
					}
				} }
				placeholder={ __( 'Enter your username' ) }
				disabled={ readOnly || isSaving }
				autoComplete="username"
			/>
			<TextControl
				label={ __( 'Application password' ) }
				value={ readOnly ? '••••••••••••••••' : applicationPassword }
				onChange={ ( value ) => {
					if ( ! readOnly ) {
						setSaveError( null );
						setApplicationPassword( value );
					}
				} }
				type="password"
				placeholder={ __( 'Enter your application password' ) }
				disabled={ readOnly || isSaving }
				autoComplete="new-password"
				help={ applicationPasswordHelp }
			/>
			<ConnectorSettingsFooter
				readOnly={ readOnly }
				onRemove={ onRemove }
				canSave={ !! username.trim() && !! applicationPassword }
				isSaving={ isSaving }
				onSave={ () =>
					handleSave( {
						username: username.trim(),
						applicationPassword,
					} )
				}
			/>
		</ConnectorSettingsFrame>
	);
}
