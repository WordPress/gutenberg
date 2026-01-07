/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { privateApis as blocksPrivateApis } from '@wordpress/blocks';
import {
	__experimentalHStack as HStack,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { DataForm } from '@wordpress/dataviews';
import { useContext, useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import BlockIcon from '../../components/block-icon';
import useBlockDisplayTitle from '../../components/block-title/use-block-display-title';
import useBlockDisplayInformation from '../../components/use-block-display-information';
const { fieldsKey, formKey } = unlock( blocksPrivateApis );
import FieldsDropdownMenu from './fields-dropdown-menu';
import { PrivateBlockContext } from '../../components/block-list/private-block-context';
import { PrivateInspectorControlsFill } from '../../components/inspector-controls/fill';

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

function BlockFields( { clientId, blockType, attributes, setAttributes } ) {
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
		<div className="block-editor-block-fields__container">
			<div className="block-editor-block-fields__header">
				<HStack spacing={ 1 }>
					<BlockIcon
						className="block-editor-block-fields__header-icon"
						icon={ blockInformation?.icon }
					/>
					<Truncate
						className="block-editor-block-fields__header-title"
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
				onChange={ setAttributes }
			/>
		</div>
	);
}

const withBlockFields = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const {
			blockType,
			isSelectionWithinCurrentSection,
			isSectionBlock,
			blockEditingMode,
			isSelected,
		} = useContext( PrivateBlockContext );

		const shouldShowBlockFields =
			window?.__experimentalContentOnlyPatternInsertion &&
			window?.__experimentalContentOnlyInspectorFields;
		const blockTypeFields = blockType?.[ fieldsKey ];

		if ( ! shouldShowBlockFields || ! blockTypeFields?.length ) {
			return <BlockEdit key="edit" { ...props } />;
		}

		return (
			<>
				<BlockEdit key="edit" { ...props } />
				{
					// Display the controls of all inner blocks for section/pattern editing.
					isSelectionWithinCurrentSection &&
						( isSectionBlock ||
							blockEditingMode === 'contentOnly' ) && (
							<PrivateInspectorControlsFill
								group="content"
								forceDisplayControls
							>
								<BlockFields
									{ ...props }
									blockType={ blockType }
								/>
							</PrivateInspectorControlsFill>
						)
				}
				{ ! isSelectionWithinCurrentSection && isSelected && (
					<PrivateInspectorControlsFill group="content">
						<BlockFields { ...props } blockType={ blockType } />
					</PrivateInspectorControlsFill>
				) }
			</>
		);
	}
);

addFilter(
	'editor.BlockEdit',
	'core/content-only-controls/block-fields',
	withBlockFields
);
