import {
	privateApis as blocksPrivateApis,
	getBlockType,
	store as blocksStore,
} from '@wordpress/blocks';
import { useDebounce } from '@wordpress/compose';
import {
	__experimentalHStack as HStack,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { DataForm } from '@wordpress/dataviews';
import { useContext, useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import BlockContext from '../../components/block-context';
import BlockIcon from '../../components/block-icon';
import useBlockDisplayTitle from '../../components/block-title/use-block-display-title';
import useBlockDisplayInformation from '../../components/use-block-display-information';
const { fieldsKey, formKey } = unlock( blocksPrivateApis );
import FieldsDropdownMenu from './fields-dropdown-menu';
import { PrivateBlockContext } from '../../components/block-list/private-block-context';
import InspectorControls from '../../components/inspector-controls/fill';

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
 * @param {Function} props.setAttributes Action to set the block's attributes.
 * @param {boolean}  props.isMultiBlock  Whether forms for multiple blocks are shown at the same time.
 *                                       This changes the behavior of the component:
 *                                       - Only the first field is shown for each block.
 *                                       - A dropdown is rendered allowing display of additional fields.
 *                                       - Hovering the block fields highlights the block in the canvas
 *                                       - Focusing a block field soft-selects the block in the canvas.
 */
function BlockFields( {
	clientId,
	blockType,
	setAttributes,
	isMultiBlock = false,
} ) {
	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );
	const blockInformation = useBlockDisplayInformation( clientId );

	const blockTypeFields = blockType?.[ fieldsKey ];

	const blockContext = useContext( BlockContext );

	const attributes = useSelect(
		( select ) => {
			const _attributes =
				select( blockEditorStore ).getBlockAttributes( clientId );
			if ( ! _attributes?.metadata?.bindings ) {
				return _attributes;
			}

			const { getBlockBindingsSource } = unlock( select( blocksStore ) );
			return Object.entries( _attributes.metadata.bindings ).reduce(
				( acc, [ attribute, binding ] ) => {
					const source = getBlockBindingsSource( binding.source );
					if ( ! source ) {
						return acc;
					}
					const values = source.getValues( {
						select,
						context: blockContext,
						bindings: { [ attribute ]: binding },
					} );
					return { ...acc, ...values };
				},
				_attributes
			);
		},
		[ blockContext, clientId ]
	);
	const { selectBlock, toggleBlockHighlight } =
		useDispatch( blockEditorStore );

	const debouncedToggleBlockHighlight = useDebounce(
		toggleBlockHighlight,
		50
	);

	const computedForm = useMemo( () => {
		if ( ! isMultiBlock ) {
			return blockType?.[ formKey ];
		}

		// For a collapsed form only show the first field by default.
		return {
			...blockType?.[ formKey ],
			fields: [ blockType?.[ formKey ]?.fields?.[ 0 ] ],
		};
	}, [ blockType, isMultiBlock ] );

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
		<div
			className="block-editor-block-fields__container"
			onMouseEnter={
				isMultiBlock
					? () => debouncedToggleBlockHighlight( clientId, true )
					: undefined
			}
			onMouseLeave={ () =>
				isMultiBlock
					? debouncedToggleBlockHighlight( clientId, false )
					: undefined
			}
			onFocus={
				isMultiBlock
					? () => {
							selectBlock(
								clientId,
								null /* null to avoid focus on the block in the canvas */
							);
					  }
					: undefined
			}
		>
			<div className="block-editor-block-fields__header">
				<HStack spacing={ 1 }>
					{ isMultiBlock && (
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
					{ ! isMultiBlock && (
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

function hasBlockFieldsSupport( blockName ) {
	return !! (
		window?.__experimentalContentOnlyInspectorFields &&
		getBlockType( blockName )?.[ fieldsKey ]
	);
}

export function BlockFieldsPanel( props ) {
	const { blockType, isSelectionWithinCurrentSection } =
		useContext( PrivateBlockContext );

	return (
		<InspectorControls group="content">
			<BlockFields
				{ ...props }
				blockType={ blockType }
				isMultiBlock={ isSelectionWithinCurrentSection }
			/>
		</InspectorControls>
	);
}

/**
 * Export block support definition.
 */
export default {
	edit: BlockFieldsPanel,
	hasSupport: hasBlockFieldsSupport,
	attributeKeys: [],
	supportsPatternEditing: true,
};
