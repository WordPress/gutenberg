/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalItem as Item,
	__experimentalText as WCText,
	__experimentalNumberControl as NumberControl,
	ExternalLink,
	FlexBlock,
	Button,
	TextControl,
	TextareaControl,
	SelectControl,
	CheckboxControl,
} from '@wordpress/components';
import { createInterpolateElement, useId, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { ReactNode } from 'react';
import type { ApiKeySource, ConnectorField } from './types';

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
								weight={ 600 }
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

export type { ApiKeySource, ConnectorField } from './types';

export interface DefaultConnectorSettingsProps {
	/**
	 * Legacy single-field callback invoked with the API key value when the
	 * user saves. Used only when {@link DefaultConnectorSettingsProps.configSchema}
	 * is not supplied.
	 */
	onSave?: ( apiKey: string ) => void | Promise< void >;
	/**
	 * Multi-field callback invoked with a `{ fieldName: value }` map of the
	 * fields the user changed when they save the connector. Used only when
	 * {@link DefaultConnectorSettingsProps.configSchema} is supplied. The whole
	 * connector is saved with a single button, so this receives every changed
	 * field at once.
	 */
	onSaveFields?: (
		values: Record< string, unknown >
	) => void | Promise< void >;
	onRemove?: () => void;
	initialValue?: string;
	helpUrl?: string;
	helpLabel?: string;
	readOnly?: boolean;
	keySource?: ApiKeySource;
	/**
	 * Typed configuration fields for the connector. When provided, the
	 * component renders every field with a single Save button for the whole
	 * connector. When omitted, the legacy single-API-key form is rendered for
	 * back-compat.
	 */
	configSchema?: ConnectorField[];
}

/**
 * Default settings form for connectors.
 *
 * When a `configSchema` is provided, renders every field as a typed control
 * with a single Save button for the whole connector; all changed fields are
 * persisted together in one request. When omitted, falls back to the legacy
 * single-API-key form for connectors that have not yet adopted the Connector
 * Fields API.
 *
 * @param props              Component props.
 * @param props.onSave       Legacy single-field save callback.
 * @param props.onSaveFields Schema save callback receiving a `{ name: value }`
 *                           map of the changed fields.
 * @param props.onRemove     Invoked when the user removes the connector.
 * @param props.initialValue Initial value for the legacy API key field.
 * @param props.helpUrl      Documentation URL for obtaining an API key.
 * @param props.helpLabel    Custom label for the help link.
 * @param props.readOnly     Whether the legacy form is read-only.
 * @param props.keySource    Source of the legacy API key.
 * @param props.configSchema Typed fields declared by the connector.
 */
export function DefaultConnectorSettings( {
	onSave,
	onSaveFields,
	onRemove,
	initialValue = '',
	helpUrl,
	helpLabel,
	readOnly = false,
	keySource,
	configSchema,
}: DefaultConnectorSettingsProps ) {
	if ( configSchema && configSchema.length > 0 ) {
		return (
			<SchemaForm
				configSchema={ configSchema }
				onSaveFields={ onSaveFields }
			/>
		);
	}

	return (
		<LegacyApiKeyForm
			onSave={ onSave }
			onRemove={ onRemove }
			initialValue={ initialValue }
			helpUrl={ helpUrl }
			helpLabel={ helpLabel }
			readOnly={ readOnly }
			keySource={ keySource }
		/>
	);
}

/* --------------------------------------------------------------------------
 * Schema-driven renderer
 * -------------------------------------------------------------------------- */

interface SchemaFormProps {
	configSchema: ConnectorField[];
	onSaveFields?: (
		values: Record< string, unknown >
	) => void | Promise< void >;
}

/**
 * Builds the `{ name: value }` baseline map for a schema.
 *
 * @param configSchema Typed fields declared by the connector.
 * @return Map of field name to its current input value.
 */
function schemaToValues(
	configSchema: ConnectorField[]
): Record< string, string | boolean > {
	const values: Record< string, string | boolean > = {};
	for ( const field of configSchema ) {
		values[ field.name ] = toInputValue( field.value ?? field.default );
	}
	return values;
}

/**
 * Renders all of a connector's fields with a single Save button that persists
 * every changed field together.
 *
 * @param props              Component props.
 * @param props.configSchema Typed fields declared by the connector.
 * @param props.onSaveFields Callback receiving the `{ name: value }` map of
 *                           changed fields.
 */
function SchemaForm( { configSchema, onSaveFields }: SchemaFormProps ) {
	const [ values, setValues ] = useState<
		Record< string, string | boolean >
	>( () => schemaToValues( configSchema ) );
	// Baseline the dirty check against the last successfully-saved snapshot so
	// the Save button settles after a save.
	const [ savedValues, setSavedValues ] = useState<
		Record< string, string | boolean >
	>( () => schemaToValues( configSchema ) );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ saveError, setSaveError ] = useState< string | null >( null );

	// Fields the user can actually edit (excludes env/constant-sourced and
	// plugin-rendered `custom` fields).
	const editableFields = configSchema.filter(
		( field ) => field.control !== 'custom' && ! field.readOnly
	);
	const isDirty = editableFields.some(
		( field ) => values[ field.name ] !== savedValues[ field.name ]
	);

	const handleSave = async () => {
		setSaveError( null );
		setIsSaving( true );
		try {
			const changed: Record< string, unknown > = {};
			for ( const field of editableFields ) {
				if ( values[ field.name ] !== savedValues[ field.name ] ) {
					changed[ field.name ] = values[ field.name ];
				}
			}
			await onSaveFields?.( changed );
			setSavedValues( { ...values } );
		} catch ( error ) {
			setSaveError(
				error instanceof Error
					? error.message
					: __( 'It was not possible to save these settings.' )
			);
		} finally {
			setIsSaving( false );
		}
	};

	return (
		<VStack spacing={ 4 } className="connector-settings">
			{ configSchema.map( ( field ) => {
				if ( field.control === 'custom' ) {
					// Plugin-rendered fields rely on a slot-fill (future work).
					return null;
				}
				return (
					<div
						key={ field.name }
						className={ `connector-settings__field connector-settings__field--${ field.control }` }
					>
						{ renderFieldControl( {
							field,
							value: values[ field.name ],
							onChange: ( next ) => {
								if ( field.readOnly ) {
									return;
								}
								setSaveError( null );
								setValues( ( prev ) => ( {
									...prev,
									[ field.name ]: next,
								} ) );
							},
							disabled: field.readOnly || isSaving,
							help: getFieldHelp( field, null ),
						} ) }
					</div>
				);
			} ) }
			{ saveError && (
				<span role="alert" className="connector-settings__error">
					{ saveError }
				</span>
			) }
			{ editableFields.length > 0 && (
				<HStack justify="flex-start">
					<Button
						__next40pxDefaultSize
						variant="primary"
						disabled={ ! isDirty || isSaving }
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

interface RenderFieldControlArgs {
	field: ConnectorField;
	value: string | boolean;
	onChange: ( next: string | boolean ) => void;
	disabled: boolean;
	help: ReactNode | undefined;
}

function renderFieldControl( {
	field,
	value,
	onChange,
	disabled,
	help,
}: RenderFieldControlArgs ): ReactNode {
	switch ( field.control ) {
		case 'checkbox':
			return (
				<CheckboxControl
					label={ field.label }
					checked={ Boolean( value ) }
					onChange={ ( next: boolean ) => onChange( next ) }
					disabled={ disabled }
					help={ help }
				/>
			);

		case 'select':
			return (
				<SelectControl
					__next40pxDefaultSize
					label={ field.label }
					value={ String( value ) }
					options={ choicesToOptions( field.choices ) }
					onChange={ ( next: string ) => onChange( next ) }
					disabled={ disabled }
					help={ help }
				/>
			);

		case 'textarea':
			return (
				<TextareaControl
					label={ field.label }
					value={ String( value ) }
					placeholder={ field.placeholder }
					onChange={ ( next: string ) => onChange( next ) }
					disabled={ disabled }
					help={ help }
				/>
			);

		case 'number':
			return (
				<NumberControl
					__next40pxDefaultSize
					label={ field.label }
					value={ String( value ) }
					placeholder={ field.placeholder }
					onChange={ ( next ) => onChange( next ?? '' ) }
					disabled={ disabled }
					help={ help }
				/>
			);

		case 'password':
		case 'url':
		case 'email':
		case 'text':
		default:
			return (
				<TextControl
					__next40pxDefaultSize
					type={ field.control === 'password' ? 'password' : 'text' }
					label={ field.label }
					value={ String( value ) }
					placeholder={ field.placeholder }
					onChange={ ( next: string ) => onChange( next ) }
					disabled={ disabled }
					help={ help }
				/>
			);
	}
}

function getFieldHelp(
	field: ConnectorField,
	saveError: string | null
): ReactNode | undefined {
	if ( saveError ) {
		return (
			<span role="alert" className="connector-settings__error">
				{ saveError }
			</span>
		);
	}

	if ( field.source === 'env' ) {
		return __( 'This value is configured using an environment variable.' );
	}
	if ( field.source === 'constant' ) {
		return __( 'This value is configured as a constant.' );
	}

	const description = field.description;
	if ( field.credentialsUrl ) {
		const linkLabel = field.credentialsUrl.replace( /^https?:\/\//, '' );
		return createInterpolateElement(
			sprintf(
				/* translators: 1: optional description text, 2: link to provider credentials. */
				__( '%1$s Get it at %2$s' ),
				description ?? '',
				'<a></a>'
			),
			{
				a: (
					<ExternalLink href={ field.credentialsUrl }>
						{ linkLabel }
					</ExternalLink>
				),
			}
		);
	}

	return description;
}

function choicesToOptions(
	choices: Record< string, string > | null | undefined
): Array< { label: string; value: string } > {
	if ( ! choices ) {
		return [];
	}
	return Object.entries( choices ).map( ( [ value, label ] ) => ( {
		value,
		label,
	} ) );
}

function toInputValue(
	raw: string | number | boolean | null | undefined
): string | boolean {
	if ( typeof raw === 'boolean' ) {
		return raw;
	}
	if ( raw === null || raw === undefined ) {
		return '';
	}
	return String( raw );
}

/* --------------------------------------------------------------------------
 * Legacy single-API-key form — unchanged behaviour for pre-7.1 connectors.
 * -------------------------------------------------------------------------- */

interface LegacyApiKeyFormProps {
	onSave?: ( apiKey: string ) => void | Promise< void >;
	onRemove?: () => void;
	initialValue?: string;
	helpUrl?: string;
	helpLabel?: string;
	readOnly?: boolean;
	keySource?: ApiKeySource;
}

function LegacyApiKeyForm( {
	onSave,
	onRemove,
	initialValue = '',
	helpUrl,
	helpLabel,
	readOnly = false,
	keySource,
}: LegacyApiKeyFormProps ) {
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
				? createInterpolateElement(
						sprintf(
							/* translators: %s: Link to provider settings. */
							__(
								'Your API key is stored securely. You can manage it at %s'
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
			return (
				<span role="alert" className="connector-settings__error">
					{ saveError }
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
					? {
							'--wp-components-color-background': '#f0f0f0',
					  }
					: undefined
			}
		>
			<TextControl
				__next40pxDefaultSize
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
			{ readOnly ? (
				onRemove && (
					<HStack justify="flex-start">
						<Button
							variant="link"
							isDestructive
							onClick={ onRemove }
						>
							{ __( 'Remove and replace' ) }
						</Button>
					</HStack>
				)
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
