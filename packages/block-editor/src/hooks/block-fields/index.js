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
					// When a field is an object, flatten all the properties to the root
					// of the block attributes.
					if ( fieldDef.type === 'object' && fieldDef.properties ) {
						const mappedValue = {};

						// Convert to field keys.
						Object.keys( fieldDef.properties ).forEach( ( key ) => {
							const attributeKey =
								fieldDef.properties[ key ].id ?? key;
							if ( item[ attributeKey ] ) {
								mappedValue[ key ] = item[ attributeKey ];
							}
						} );
						return mappedValue;
					}
					return item[ fieldDef.id ];
				},
				setValue: ( { value } ) => {
					// When a field is an object, flatten all the properties to the root
					// of the block attributes.
					if ( fieldDef.type === 'object' && fieldDef.properties ) {
						const mappedValue = {};

						// Convert to attribute keys.
						Object.keys( fieldDef.properties ).forEach( ( key ) => {
							if ( value[ key ] ) {
								const attributeKey =
									fieldDef.properties[ key ].id ?? key;
								mappedValue[ attributeKey ] = value[ key ];
							}
						} );
						return mappedValue;
					}
					return { [ fieldDef.id ]: value };
				},
			};

			// Only add custom Edit component if one exists for this type
			if ( fieldDef.Edit ) {
				// Use EditConfig pattern: Edit is an object with control type and config props
				field.Edit = createConfiguredControl( {
					control: fieldDef.Edit,
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
