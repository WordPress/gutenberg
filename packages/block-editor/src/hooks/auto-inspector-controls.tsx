import { getBlockType, store as blocksStore } from '@wordpress/blocks';
import { PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { DataForm } from '@wordpress/dataviews';
import { useContext, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import InspectorControls from '../components/inspector-controls';
import { useBlockEditingMode } from '../components/block-editing-mode';
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';
import BlockContext from '../components/block-context';
import { generateFieldsFromAttributes } from './generate-fields-from-attributes';
import type { AutoGenerateAttribute, AutoRegisterControlsProps } from './types';

/**
 * Checks if a block has any attributes marked for auto-generated inspector controls.
 *
 * @param blockTypeAttributes - The block type's attributes object.
 * @return True if any attribute has autoGenerateControl marker.
 */
function hasAutoGenerateControl(
	blockTypeAttributes: Record< string, AutoGenerateAttribute > | undefined
): boolean {
	if ( ! blockTypeAttributes ) {
		return false;
	}
	return Object.values( blockTypeAttributes ).some(
		( attr ) => attr?.autoGenerateControl
	);
}

/**
 * Renders DataForm-based inspector controls for auto-registered PHP-only blocks.
 *
 * Fields are generated on-the-fly from attributes marked with `autoGenerateControl`
 * during PHP registration.
 *
 * @param props               Component props.
 * @param props.name          Block name.
 * @param props.clientId      Block client ID.
 * @param props.setAttributes Function to update block attributes.
 */
function AutoRegisterControls( {
	name,
	clientId,
	setAttributes,
}: AutoRegisterControlsProps ) {
	const blockEditingMode = useBlockEditingMode();

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

	const blockType = getBlockType( name );

	// Generate fields from user-defined attributes marked by PHP.
	// The autoGenerateControl marker excludes block support attributes
	// (which have their own UI) and internal state (role: 'local').
	// Memoized since blockType.attributes don't change after registration.
	const { fields, form } = useMemo( () => {
		if ( ! blockType?.attributes ) {
			return { fields: [], form: { fields: [] } };
		}
		return generateFieldsFromAttributes( blockType.attributes );
	}, [ blockType?.attributes ] );

	if ( blockEditingMode !== 'default' ) {
		return null;
	}

	if ( ! fields || fields.length === 0 ) {
		return null;
	}

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Settings' ) }>
				<DataForm
					// The controls only render for a block in the store.
					data={ attributes! }
					fields={ fields }
					form={ form }
					onChange={ setAttributes }
				/>
			</PanelBody>
		</InspectorControls>
	);
}

export default {
	edit: AutoRegisterControls,
	attributeKeys: [],
	hasSupport( name: string ) {
		const blockType = getBlockType( name );
		return hasAutoGenerateControl( blockType?.attributes );
	},
};
