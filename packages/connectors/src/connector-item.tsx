/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	ExternalLink,
	FlexBlock,
	Button,
	TextControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronDown } from '@wordpress/icons';

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
	isExpanded?: boolean;
	onToggle?: () => void;
}

export function ConnectorItem( {
	className,
	icon,
	name,
	description,
	actionArea,
	children,
	isExpanded = false,
	onToggle,
}: ConnectorItemProps ) {
	const classes = [ 'connector-card', isExpanded && 'is-expanded', className ]
		.filter( Boolean )
		.join( ' ' );

	return (
		<div className={ classes }>
			<HStack
				alignment="center"
				spacing={ 4 }
				className="connector-card__header"
			>
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
				{ onToggle && (
					<Button
						className="connector-card__toggle"
						onClick={ onToggle }
						aria-expanded={ isExpanded }
						label={
							isExpanded
								? __( 'Collapse settings' )
								: __( 'Expand settings' )
						}
						icon={ chevronDown }
						size="compact"
					/>
				) }
			</HStack>
			{ isExpanded && children && (
				<div className="connector-card__body">{ children }</div>
			) }
		</div>
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
					{ __(
						'Your API key is stored securely. You can reset it at'
					) }{ ' ' }
					{ helpUrl ? (
						<ExternalLink href={ helpUrl }>
							{ helpLinkLabel }
						</ExternalLink>
					) : undefined }
				</>
			);
		}
		if ( saveError ) {
			return <Text style={ { color: '#cc1818' } }>{ saveError }</Text>;
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
			{ readOnly ? (
				<>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'API Key' ) }
						value={ apiKey }
						onChange={ () => {} }
						placeholder="YOUR_API_KEY"
						disabled
						help={ getHelp() }
					/>
					<Button variant="link" isDestructive onClick={ onRemove }>
						{ __( 'Remove and replace' ) }
					</Button>
				</>
			) : (
				<>
					<HStack
						alignment="bottom"
						spacing={ 3 }
						className="connector-settings__inline"
					>
						<FlexBlock>
							<TextControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={ __( 'API Key' ) }
								value={ apiKey }
								onChange={ ( value ) => {
									setSaveError( null );
									setApiKey( value );
								} }
								placeholder="YOUR_API_KEY"
								disabled={ isSaving }
							/>
						</FlexBlock>
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
					{ ( saveError || helpLink ) && (
						<Text
							className="connector-settings__help"
							variant={ saveError ? undefined : 'muted' }
							size={ 12 }
							style={
								saveError ? { color: '#cc1818' } : undefined
							}
						>
							{ saveError || helpLink }
						</Text>
					) }
				</>
			) }
		</VStack>
	);
}
