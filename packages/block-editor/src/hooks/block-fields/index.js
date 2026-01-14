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

/**
 * Creates a configured control component that wraps a custom control
 * and passes configuration as props.
 *
 * @param {Component} ControlComponent The React component for the control.
 * @param {Object}    config           The control configuration passed as a prop.
 *
 * @return {Function} A wrapped control component
 */
function createConfiguredControl( ControlComponent, config = {} ) {
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
				...fieldDef,
			};

			// These should be custom Edit components, not replaced here.
			//
			// - rich-text control: it needs clientId
			// - link control: does not need anything extra
			// - media control: needs the Edit config
			if (
				'string' === typeof fieldDef.Edit &&
				fieldDef.Edit === 'rich-text'
			) {
				field.Edit = createConfiguredControl( RichText, {
					clientId,
				} );
			} else if (
				'string' === typeof fieldDef.Edit &&
				fieldDef.Edit === 'link'
			) {
				field.Edit = createConfiguredControl( Link );
			} else if (
				'object' === typeof fieldDef.Edit &&
				fieldDef.Edit.control === 'media'
			) {
				field.Edit = createConfiguredControl( Media, {
					...fieldDef.Edit,
				} );
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
