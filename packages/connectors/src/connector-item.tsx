/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalItem as Item,
	__experimentalText as Text,
	ExternalLink,
	FlexBlock,
	Button,
	TextControl,
} from '@wordpress/components';
import { createInterpolateElement, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { ReactNode } from 'react';

export interface ConnectorItemProps {
	className?: string;
	icon?: ReactNode;
	name: string;
	description: string;
	actionArea?: ReactNode;
	children?: ReactNode;
}

export function ConnectorItem( {
	className,
	icon,
	name,
	description,
	actionArea,
	children,
}: ConnectorItemProps ) {
	return (
		<Item className={ className }>
			<VStack spacing={ 4 }>
				<HStack alignment="center" spacing={ 4 }>
					{ icon }
					<FlexBlock>
						<VStack spacing={ 0 }>
							<Text weight={ 600 } size={ 15 }>
								{ name }
							</Text>
							<Text variant="muted" size={ 12 }>
								{ description }
							</Text>
						</VStack>
					</FlexBlock>
					{ actionArea }
				</HStack>
				{ children }
			</VStack>
		</Item>
	);
}

export interface DefaultConnectorSettingsProps {
	onSave?: ( apiKey: string ) => void | Promise< void >;
	onRemove?: () => void;
	initialValue?: string;
	helpUrl?: string;
	helpLabel?: string;
	readOnly?: boolean;
}

/**
 * Default settings form for connectors.
 *
 * @param props              - Component props.
 * @param props.onSave       - Callback invoked with the API key when the user saves.
 * @param props.onRemove     - Callback invoked when the user removes the connector.
 * @param props.initialValue - Initial value for the API key field.
 * @param props.helpUrl      - URL to documentation for obtaining an API key.
 * @param props.helpLabel    - Custom label for the help link. Defaults to the URL without protocol.
 * @param props.readOnly     - Whether the form is in read-only mode.
 */
export function DefaultConnectorSettings( {
	onSave,
	onRemove,
	initialValue = '',
	helpUrl,
	helpLabel,
	readOnly = false,
}: DefaultConnectorSettingsProps ) {
	const [ apiKey, setApiKey ] = useState( initialValue );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ saveError, setSaveError ] = useState< string | null >( null );

	const helpLinkLabel = helpLabel || helpUrl?.replace( /^https?:\/\//, '' );

	const helpLink = helpUrl
		? createInterpolateElement(
				sprintf(
					/* translators: %s: Link to provider settings. */
					__( 'Get your API key at %s' ),
					'<a></a>'
				),
				{
					a: (
						<ExternalLink href={ helpUrl }>
							{ helpLinkLabel }
						</ExternalLink>
					),
				}
		  )
		: undefined;

	const getHelp = () => {
		if ( readOnly ) {
			return helpUrl
				? createInterpolateElement(
						sprintf(
							/* translators: %s: Link to provider settings. */
							__(
								'Your API key is stored securely. You can reset it at %s'
							),
							'<a></a>'
						),
						{
							a: (
								<ExternalLink href={ helpUrl }>
									{ helpLinkLabel }
								</ExternalLink>
							),
						}
				  )
				: __( 'Your API key is stored securely.' );
		}
		if ( saveError ) {
			return <span style={ { color: '#cc1818' } }>{ saveError }</span>;
		}
		return helpLink;
	};

	const handleSave = async () => {
		setSaveError( null );
		setIsSaving( true );
		try {
			await onSave?.( apiKey );
		} catch ( error ) {
			setSaveError(
				error instanceof Error
					? error.message
					: __(
							'It was not possible to connect to the provider using this key.'
					  )
			);
		} finally {
			setIsSaving( false );
		}
	};

	return (
		<VStack
			spacing={ 4 }
			className="connector-settings"
			style={
				readOnly
					? ( {
							'--wp-components-color-background': '#f0f0f0',
					  } as React.CSSProperties )
					: undefined
			}
		>
			<TextControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'API Key' ) }
				value={ apiKey }
				onChange={ ( value ) => {
					if ( ! readOnly ) {
						setSaveError( null );
						setApiKey( value );
					}
				} }
				placeholder="YOUR_API_KEY"
				disabled={ readOnly || isSaving }
				help={ getHelp() }
			/>
			{ readOnly ? (
				<Button variant="link" isDestructive onClick={ onRemove }>
					{ __( 'Remove and replace' ) }
				</Button>
			) : (
				<HStack justify="flex-start">
					<Button
						__next40pxDefaultSize
						variant="primary"
						disabled={ ! apiKey || isSaving }
						accessibleWhenDisabled
						isBusy={ isSaving }
						onClick={ handleSave }
					>
						{ __( 'Save' ) }
					</Button>
				</HStack>
			) }
		</VStack>
	);
}
