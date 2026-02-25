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
							<Text weight={ 600 } size={ 15 }>{ name }</Text>
							<Text variant="muted" size={ 12 }>{ description }</Text>
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
	validate?: ( value: string ) => string | undefined;
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
	validate,
}: DefaultConnectorSettingsProps ) {
	const [ apiKey, setApiKey ] = useState( initialValue );
	const [ hasBlurred, setHasBlurred ] = useState( false );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ saveError, setSaveError ] = useState< string | null >( null );

	const validationError =
		! readOnly && hasBlurred && apiKey ? validate?.( apiKey ) : undefined;

	const helpLinkLabel =
		helpLabel || helpUrl?.replace( /^https?:\/\//, '' );

	const helpLink = helpUrl ? (
		<>
			{ __( 'Get your API key at' ) }{ ' ' }
			<ExternalLink href={ helpUrl }>{ helpLinkLabel }</ExternalLink>
		</>
	) : undefined;

	const getHelp = () => {
		if ( readOnly ) {
			return (
				<>
					{ __( 'Your API key is stored securely. You can reset it at' ) }{ ' ' }
					{ helpUrl ? (
						<ExternalLink href={ helpUrl }>
							{ helpLinkLabel }
						</ExternalLink>
					) : undefined }
				</>
			);
		}
		if ( saveError ) {
			return (
				<span style={ { color: '#cc1818' } }>
					{ saveError }
				</span>
			);
		}
		if ( validationError ) {
			return (
				<span style={ { color: '#cc1818' } }>
					{ validationError }
				</span>
			);
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
					: __( 'Failed to save API key. Please try again.' )
			);
		} finally {
			setIsSaving( false );
		}
	};

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
				onChange={ readOnly ? undefined : ( value ) => {
					setSaveError( null );
					setApiKey( value );
				} }
				onBlur={ () => setHasBlurred( true ) }
				placeholder="YOUR_API_KEY"
				disabled={ readOnly || isSaving }
				help={ getHelp() }
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
						disabled={ ! apiKey || !! validationError || isSaving }
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
