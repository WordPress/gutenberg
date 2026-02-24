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
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { ReactNode } from 'react';

export interface ConnectorItemProps {
	icon?: ReactNode;
	name: string;
	description: string;
	actionArea?: ReactNode;
	children?: ReactNode;
}

export function ConnectorItem( {
	icon,
	name,
	description,
	actionArea,
	children,
}: ConnectorItemProps ) {
	return (
		<Item>
			<VStack spacing={ 4 }>
				<HStack alignment="center" spacing={ 4 }>
					{ icon }
					<FlexBlock>
						<VStack spacing={ 0 }>
							<Text weight={ 600 }>{ name }</Text>
							<Text variant="muted">{ description }</Text>
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
	onSave?: ( apiKey: string ) => void;
	onRemove?: () => void;
	initialValue?: string;
	helpUrl?: string;
	helpLabel?: string;
	readOnly?: boolean;
}

/**
 * Default settings form for connectors.
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

	const helpLinkLabel =
		helpLabel || helpUrl?.replace( /^https?:\/\//, '' );

	return (
		<VStack
			spacing={ 4 }
			className="connector-settings"
			style={ readOnly ? { '--wp-components-color-background': '#f0f0f0' } as React.CSSProperties : undefined }
		>
			<TextControl
				__nextHasNoMarginBottom
				label={ __( 'API Key' ) }
				value={ apiKey }
				onChange={ readOnly ? undefined : setApiKey }
				placeholder="YOUR_API_KEY"
				disabled={ readOnly }
				help={
					readOnly ? (
						<>
							{ __(
								'Your API key is a secret, and we only show the full key for now. You can reset your API key at'
							) }{ ' ' }
							{ helpUrl ? (
								<ExternalLink href={ helpUrl }>
									{ helpLinkLabel }
								</ExternalLink>
							) : undefined }
						</>
					) : helpUrl ? (
						<>
							{ __( 'Get your API key at' ) }{ ' ' }
							<ExternalLink href={ helpUrl }>
								{ helpLinkLabel }
							</ExternalLink>
						</>
					) : undefined
				}
			/>
			{ readOnly ? (
				<Button
					variant="link"
					isDestructive
					onClick={ onRemove }
				>
					{ __( 'Remove and replace' ) }
				</Button>
			) : (
				<HStack justify="flex-start">
					<Button
						variant="primary"
						onClick={ () => onSave?.( apiKey ) }
					>
						{ __( 'Save' ) }
					</Button>
				</HStack>
			) }
		</VStack>
	);
}
