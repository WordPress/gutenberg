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
import { __ } from '@wordpress/i18n';

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
 * @param {Component} ControlComponent The React component for the control.
 * @param {string}    type             The type of control.
 * @param {Object}    config           The control configuration passed as a prop.
 *
 * @return {Function} A wrapped control component
 */
function createConfiguredControl( ControlComponent, type, config ) {
	if ( ! ControlComponent ) {
		throw new Error( `Control type "${ type }" not found` );
	}

	return function ConfiguredControl( props ) {
		return <ControlComponent { ...props } config={ config } />;
	};
}

/**
 * Component that renders a DataForm for a single block's attributes
 * @param {Object}   props
 * @param {string}   props.clientId      The clientId of the block.
 * @param {Object}   props.blockType     The blockType definition.
 * @param {Object}   props.attributes    The block's attribute values.
 * @param {Function} props.setAttributes Action to set the block's attributes.
 * @param {boolean}  props.isCollapsed   Whether the DataForm is rendered as 'collapsed' with only the first field
 *                                       displayed by default. When collapsed a dropdown is displayed to allow
 *                                       displaying additional fields. The block's title is displayed as the title.
 *                                       The collapsed mode is often used when multiple BlockForms are shown together.
 */
function BlockFields( {
	clientId,
	blockType,
	attributes,
	setAttributes,
	isCollapsed = false,
} ) {
	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );
	const blockInformation = useBlockDisplayInformation( clientId );

	const blockTypeFields = blockType?.[ fieldsKey ];

	const computedForm = useMemo( () => {
		if ( ! isCollapsed ) {
			return blockType?.[ formKey ];
		}

		// For a collapsed form only show the first field by default.
		return {
			...blockType?.[ formKey ],
			fields: [ blockType?.[ formKey ]?.fields?.[ 0 ] ],
		};
	}, [ blockType, isCollapsed ] );

	const [ form, setForm ] = useState( computedForm );

	// Build DataForm fields with proper structure
	const dataFormFields = useMemo( () => {
		if ( ! blockTypeFields?.length ) {
			return [];
		}

		return blockTypeFields.map( ( fieldDef ) => {
			const field = {
				id: fieldDef.id,
				label: fieldDef.label,
				type: fieldDef.type, // Use the field's type; DataForm will use built-in or custom Edit
			};

			// If the field defines a `mapping`, then custom `getValue` and `setValue`
			// implementations are provided.
			// These functions map from the inconsistent attribute keys found on blocks
			// to consistent keys that the field can use internally (and back again).
			// When `mapping` isn't provided, we can use the field API's default
			// implementation of these functions.
			if ( fieldDef.mapping ) {
				field.getValue = ( { item } ) => {
					// Extract mapped properties from the block attributes
					const mappedValue = {};
					Object.entries( fieldDef.mapping ).forEach(
						( [ key, attrKey ] ) => {
							mappedValue[ key ] = item[ attrKey ];
						}
					);
					return mappedValue;
				};
				field.setValue = ( { value } ) => {
					const attributeUpdates = {};
					Object.entries( fieldDef.mapping ).forEach(
						( [ key, attrKey ] ) => {
							attributeUpdates[ attrKey ] = value[ key ];
						}
					);
					return attributeUpdates;
				};
			}

			// Only add custom Edit component if one exists for this type
			const ControlComponent = CONTROLS[ fieldDef.type ];
			if ( ControlComponent ) {
				// Use EditConfig pattern: Edit is an object with control type and config props
				field.Edit = createConfiguredControl(
					ControlComponent,
					fieldDef.type,
					{
						clientId,
						fieldDef,
					}
				);
			}

			return field;
		} );
	}, [ blockTypeFields, clientId ] );

	if ( ! blockTypeFields?.length ) {
		// TODO - we might still want to show a placeholder for blocks with no fields.
		// for example, a way to select the block.
		return null;
	}

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

	return (
		<div className="block-editor-block-fields__container">
			<div className="block-editor-block-fields__header">
				<HStack spacing={ 1 }>
					{ isCollapsed && (
						<>
							<BlockIcon
								className="block-editor-block-fields__header-icon"
								icon={ blockInformation?.icon }
							/>
							<h2 className="block-editor-block-fields__header-title">
								<Truncate numberOfLines={ 1 }>
									{ blockTitle }
								</Truncate>
							</h2>
							<FieldsDropdownMenu
								fields={ dataFormFields }
								visibleFields={ form.fields }
								onToggleField={ handleToggleField }
							/>
						</>
					) }
					{ ! isCollapsed && (
						<h2 className="block-editor-block-fields__header-title">
							{ __( 'Content' ) }
						</h2>
					) }
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
									isCollapsed
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
