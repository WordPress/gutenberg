/**
 * WordPress dependencies
 */
import {
	store as blocksStore,
	privateApis as blocksPrivateApis,
} from '@wordpress/blocks';
import {
	__experimentalHStack as HStack,
	__experimentalTruncate as Truncate,
	Icon,
	Navigator,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { arrowLeft, arrowRight } from '@wordpress/icons';
import { DataForm } from '@wordpress/dataviews';
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import useBlockDisplayInformation from '../use-block-display-information';
const { fieldsKey, formKey } = unlock( blocksPrivateApis );
import FieldsDropdownMenu from './fields-dropdown-menu';

// controls
import RichText from './rich-text';
import Media from './media';
import Link from './link';

const CONTROLS = {
	richtext: RichText,
	media: Media,
	link: Link,
};

/**
 * Creates a configured control component that wraps a custom control
 * and passes configuration as props.
 *
 * @param {Object} config         - The control configuration
 * @param {string} config.control - The control type (key in CONTROLS map)
 * @return {Function} A wrapped control component
 */
function createConfiguredControl( config ) {
	const { control, ...controlConfig } = config;
	const ControlComponent = CONTROLS[ control ];

	if ( ! ControlComponent ) {
		throw new Error( `Control type "${ control }" not found` );
	}

	return function ConfiguredControl( props ) {
		return <ControlComponent { ...props } config={ controlConfig } />;
	};
}

/**
 * Normalize a media value to a canonical structure.
 * Only includes properties that are present in the field's mapping (if provided).
 *
 * @param {Object} value    - The mapped value from the block attributes (with canonical keys)
 * @param {Object} fieldDef - Optional field definition containing the mapping
 * @return {Object} Normalized media value with canonical properties
 */
function normalizeMediaValue( value, fieldDef ) {
	const defaults = {
		id: null,
		url: '',
		caption: '',
		alt: '',
		type: 'image',
		poster: '',
		featuredImage: false,
		link: '',
	};

	const result = {};

	// If there's a mapping, only include properties that are in it
	if ( fieldDef?.mapping ) {
		Object.keys( fieldDef.mapping ).forEach( ( key ) => {
			result[ key ] = value?.[ key ] ?? defaults[ key ] ?? '';
		} );
		return result;
	}

	// Without mapping, include all default properties
	Object.keys( defaults ).forEach( ( key ) => {
		result[ key ] = value?.[ key ] ?? defaults[ key ];
	} );
	return result;
}

/**
 * Denormalize a media value from canonical structure back to mapped keys.
 * Only includes properties that are present in the field's mapping.
 *
 * @param {Object} value    - The normalized media value
 * @param {Object} fieldDef - The field definition containing the mapping
 * @return {Object} Value with only mapped properties
 */
function denormalizeMediaValue( value, fieldDef ) {
	if ( ! fieldDef.mapping ) {
		return value;
	}

	const result = {};
	Object.entries( fieldDef.mapping ).forEach( ( [ key ] ) => {
		if ( key in value ) {
			result[ key ] = value[ key ];
		}
	} );
	return result;
}

/**
 * Normalize a link value to a canonical structure.
 * Only includes properties that are present in the field's mapping (if provided).
 *
 * @param {Object} value    - The mapped value from the block attributes (with canonical keys)
 * @param {Object} fieldDef - Optional field definition containing the mapping
 * @return {Object} Normalized link value with canonical properties
 */
function normalizeLinkValue( value, fieldDef ) {
	const defaults = {
		url: '',
		rel: '',
		linkTarget: '',
		destination: '',
	};

	const result = {};

	// If there's a mapping, only include properties that are in it
	if ( fieldDef?.mapping ) {
		Object.keys( fieldDef.mapping ).forEach( ( key ) => {
			result[ key ] = value?.[ key ] ?? defaults[ key ] ?? '';
		} );
		return result;
	}

	// Without mapping, include all default properties
	Object.keys( defaults ).forEach( ( key ) => {
		result[ key ] = value?.[ key ] ?? defaults[ key ];
	} );
	return result;
}

/**
 * Denormalize a link value from canonical structure back to mapped keys.
 * Only includes properties that are present in the field's mapping.
 *
 * @param {Object} value    - The normalized link value
 * @param {Object} fieldDef - The field definition containing the mapping
 * @return {Object} Value with only mapped properties
 */
function denormalizeLinkValue( value, fieldDef ) {
	if ( ! fieldDef.mapping ) {
		return value;
	}

	const result = {};
	Object.entries( fieldDef.mapping ).forEach( ( [ key ] ) => {
		if ( key in value ) {
			result[ key ] = value[ key ];
		}
	} );
	return result;
}

function BlockFields( { clientId } ) {
	const { attributes, blockType } = useSelect(
		( select ) => {
			const { getBlockAttributes, getBlockName } =
				select( blockEditorStore );
			const { getBlockType } = select( blocksStore );
			const blockName = getBlockName( clientId );
			return {
				attributes: getBlockAttributes( clientId ),
				blockType: getBlockType( blockName ),
			};
		},
		[ clientId ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );
	const blockInformation = useBlockDisplayInformation( clientId );

	const blockTypeFields = blockType?.[ fieldsKey ];

	const [ form, setForm ] = useState( () => {
		return blockType?.[ formKey ];
	} );

	// Build DataForm fields with proper structure
	const dataFormFields = useMemo( () => {
		if ( ! blockTypeFields?.length ) {
			return [];
		}

		return blockTypeFields.map( ( fieldDef ) => {
			const ControlComponent = CONTROLS[ fieldDef.type ];

			const defaultValues = {};
			if ( fieldDef.mapping && blockType?.attributes ) {
				Object.entries( fieldDef.mapping ).forEach(
					( [ key, attrKey ] ) => {
						defaultValues[ key ] =
							blockType.attributes[ attrKey ]?.defaultValue ??
							undefined;
					}
				);
			}

			const field = {
				id: fieldDef.id,
				label: fieldDef.label,
				type: fieldDef.type, // Use the field's type; DataForm will use built-in or custom Edit
				config: { ...fieldDef.args, defaultValues },
				hideLabelFromVision: fieldDef.id === 'content',
				// getValue and setValue handle the mapping to block attributes
				getValue: ( { item } ) => {
					if ( fieldDef.mapping ) {
						// Extract mapped properties from the block attributes
						const mappedValue = {};
						Object.entries( fieldDef.mapping ).forEach(
							( [ key, attrKey ] ) => {
								mappedValue[ key ] = item[ attrKey ];
							}
						);

						// Normalize to canonical structure based on field type
						if ( fieldDef.type === 'media' ) {
							return normalizeMediaValue( mappedValue, fieldDef );
						}
						if ( fieldDef.type === 'link' ) {
							return normalizeLinkValue( mappedValue, fieldDef );
						}

						// For other types, return as-is
						return mappedValue;
					}
					// For simple id-based fields, use the id as the attribute key
					return item[ fieldDef.id ];
				},
				setValue: ( { item, value } ) => {
					if ( fieldDef.mapping ) {
						// Denormalize from canonical structure back to mapped keys
						let denormalizedValue = value;
						if ( fieldDef.type === 'media' ) {
							denormalizedValue = denormalizeMediaValue(
								value,
								fieldDef
							);
						} else if ( fieldDef.type === 'link' ) {
							denormalizedValue = denormalizeLinkValue(
								value,
								fieldDef
							);
						}

						// Build an object with all mapped attributes
						const updates = {};
						Object.entries( fieldDef.mapping ).forEach(
							( [ key, attrKey ] ) => {
								// If key is explicitly in value, use it (even if undefined to allow clearing)
								// Otherwise, preserve the old value
								if ( key in denormalizedValue ) {
									updates[ attrKey ] =
										denormalizedValue[ key ];
								} else {
									updates[ attrKey ] = item[ attrKey ];
								}
							}
						);
						return updates;
					}
					// For simple id-based fields, use the id as the attribute key
					return { [ fieldDef.id ]: value };
				},
			};

			// Only add custom Edit component if one exists for this type
			if ( ControlComponent ) {
				// Use EditConfig pattern: Edit is an object with control type and config props
				field.Edit = createConfiguredControl( {
					control: fieldDef.type,
					clientId,
					fieldDef,
				} );
			}

			return field;
		} );
	}, [ blockTypeFields, blockType?.attributes, clientId ] );

	const handleToggleField = ( fieldId ) => {
		setForm( ( prev ) => {
			if ( prev.fields?.includes( fieldId ) ) {
				return {
					...prev,
					fields: prev.fields.filter( ( id ) => id !== fieldId ),
				};
			}

			return {
				...prev,
				fields: [ ...( prev.fields || [] ), fieldId ],
			};
		} );
	};

	if ( ! blockTypeFields?.length ) {
		// TODO - we might still want to show a placeholder for blocks with no fields.
		// for example, a way to select the block.
		return null;
	}

	return (
		<div className="block-editor-content-only-controls__fields-container">
			<div className="block-editor-content-only-controls__fields-header">
				<HStack spacing={ 1 }>
					<BlockIcon
						className="block-editor-content-only-controls__fields-header-icon"
						icon={ blockInformation?.icon }
					/>
					<Truncate
						className="block-editor-content-only-controls__fields-header-title"
						numberOfLines={ 1 }
					>
						{ blockTitle }
					</Truncate>
					<FieldsDropdownMenu
						fields={ dataFormFields }
						visibleFields={ form.fields }
						onToggleField={ handleToggleField }
					/>
				</HStack>
			</div>
			<DataForm
				data={ attributes }
				fields={ dataFormFields }
				form={ form }
				onChange={ ( changes ) => {
					updateBlockAttributes( clientId, changes );
				} }
			/>
		</div>
	);
}

function DrillDownButton( { clientId } ) {
	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );
	const blockInformation = useBlockDisplayInformation( clientId );
	return (
		<div className="block-editor-content-only-controls__button-panel">
			<Navigator.Button
				path={ `/${ clientId }` }
				className="block-editor-content-only-controls__drill-down-button"
			>
				<HStack expanded justify="space-between">
					<HStack justify="flex-start" spacing={ 1 }>
						<BlockIcon icon={ blockInformation?.icon } />
						<div>{ blockTitle }</div>
					</HStack>
					<Icon icon={ arrowRight } />
				</HStack>
			</Navigator.Button>
		</div>
	);
}

function ContentOnlyControlsScreen( {
	rootClientId,
	contentClientIds,
	parentClientIds,
	isNested,
} ) {
	const isRootContentBlock = useSelect(
		( select ) => {
			const { getBlockName } = select( blockEditorStore );
			const blockName = getBlockName( rootClientId );
			const { hasContentRoleAttribute } = unlock( select( blocksStore ) );
			return hasContentRoleAttribute( blockName );
		},
		[ rootClientId ]
	);

	if ( ! isRootContentBlock && ! contentClientIds.length ) {
		return null;
	}

	return (
		<>
			{ isNested && (
				<div className="block-editor-content-only-controls__button-panel">
					<Navigator.BackButton className="block-editor-content-only-controls__back-button">
						<HStack expanded spacing={ 1 } justify="flex-start">
							<Icon icon={ arrowLeft } />
							<div>{ __( 'Back' ) }</div>
						</HStack>
					</Navigator.BackButton>
				</div>
			) }
			{ isRootContentBlock && <BlockFields clientId={ rootClientId } /> }
			{ contentClientIds.map( ( clientId ) => {
				if ( parentClientIds?.[ clientId ] ) {
					return (
						<DrillDownButton
							key={ clientId }
							clientId={ clientId }
						/>
					);
				}

				return <BlockFields key={ clientId } clientId={ clientId } />;
			} ) }
		</>
	);
}

export default function ContentOnlyControls( { rootClientId } ) {
	const { updatedRootClientId, nestedContentClientIds, contentClientIds } =
		useSelect(
			( select ) => {
				const { getClientIdsOfDescendants, getBlockEditingMode } =
					select( blockEditorStore );

				// _nestedContentClientIds is for content blocks within 'drilldowns'.
				// It's an object where the key is the parent clientId, and the element is
				// an array of child clientIds whose controls are shown within the drilldown.
				const _nestedContentClientIds = {};

				// _contentClientIds is the list of contentClientIds for blocks being
				// shown at the root level. Includes parent blocks that might have a drilldown,
				// but not the children of those blocks.
				const _contentClientIds = [];

				// An array of all nested client ids. Used for ensuring blocks within drilldowns
				// don't appear at the root level.
				let allNestedClientIds = [];

				// A flattened list of all content clientIds to arrange into the
				// groups above.
				const allContentClientIds = getClientIdsOfDescendants(
					rootClientId
				).filter(
					( clientId ) =>
						getBlockEditingMode( clientId ) === 'contentOnly'
				);

				for ( const clientId of allContentClientIds ) {
					const childClientIds = getClientIdsOfDescendants(
						clientId
					).filter(
						( childClientId ) =>
							getBlockEditingMode( childClientId ) ===
							'contentOnly'
					);

					// If there's more than one child block, use a drilldown.
					if (
						childClientIds.length > 1 &&
						! allNestedClientIds.includes( clientId )
					) {
						_nestedContentClientIds[ clientId ] = childClientIds;
						allNestedClientIds = [
							allNestedClientIds,
							...childClientIds,
						];
					}

					if ( ! allNestedClientIds.includes( clientId ) ) {
						_contentClientIds.push( clientId );
					}
				}

				// Avoid showing only one drilldown block at the root.
				if (
					_contentClientIds.length === 1 &&
					Object.keys( _nestedContentClientIds ).length === 1
				) {
					const onlyParentClientId = Object.keys(
						_nestedContentClientIds
					)[ 0 ];
					return {
						updatedRootClientId: onlyParentClientId,
						contentClientIds:
							_nestedContentClientIds[ onlyParentClientId ],
						nestedContentClientIds: {},
					};
				}

				return {
					nestedContentClientIds: _nestedContentClientIds,
					contentClientIds: _contentClientIds,
				};
			},
			[ rootClientId ]
		);

	return (
		<Navigator initialPath="/">
			<Navigator.Screen
				path="/"
				className="block-editor-content-only-controls__screen"
			>
				<ContentOnlyControlsScreen
					rootClientId={ updatedRootClientId ?? rootClientId }
					contentClientIds={ contentClientIds }
					parentClientIds={ nestedContentClientIds }
				/>
			</Navigator.Screen>
			{ Object.keys( nestedContentClientIds ).map( ( clientId ) => (
				<Navigator.Screen
					key={ clientId }
					path={ `/${ clientId }` }
					className="block-editor-content-only-controls__screen"
				>
					<ContentOnlyControlsScreen
						isNested
						rootClientId={ clientId }
						contentClientIds={ nestedContentClientIds[ clientId ] }
					/>
				</Navigator.Screen>
			) ) }
		</Navigator>
	);
}
