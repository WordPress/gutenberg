/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { getBlockBindingsSource, getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

/**
 * Custom hook that returns the binding state for a specific field.
 *
 * @param {Object} props              Hook props.
 * @param {string} props.fieldId      The field/attribute identifier.
 * @param {string} props.blockName    The block type name.
 * @param {string} props.clientId     The block client ID.
 * @param {Object} props.blockContext The block context.
 * @return {Object} Binding state object.
 */
export default function useBindingState( {
	fieldId,
	blockName,
	clientId,
	blockContext,
} ) {
	return useSelect(
		( select ) => {
			// Get block attributes
			const attributes =
				select( blockEditorStore ).getBlockAttributes( clientId );
			const binding = attributes?.metadata?.bindings?.[ fieldId ];

			// Check if field is bindable
			const blockType = getBlockType( blockName );
			const supportedAttrs =
				blockType?.supports
					?.__experimentalBlockBindingsSupportedAttributes;
			const isBindable =
				Array.isArray( supportedAttrs ) &&
				supportedAttrs.includes( fieldId );

			// If not bound, return basic state
			if ( ! binding ) {
				return {
					isBound: false,
					binding: null,
					source: null,
					isEditable: false,
					isValid: true,
					sourceLabel: '',
					fieldLabel: '',
					isBindable,
				};
			}

			// Get source definition
			const source = getBlockBindingsSource( binding.source );
			const isValid = !! source;

			// Check if field is editable
			const isEditable =
				isValid &&
				!! source.setValues &&
				( ! source.canUserEditValue ||
					source.canUserEditValue( {
						select,
						context: blockContext,
						args: binding.args,
					} ) );

			// Get source label
			const sourceLabel = source?.label || binding.source;

			// Get field label from compatible fields if available
			let fieldLabel = '';
			if ( source?.getFieldsList ) {
				const fieldsList = source.getFieldsList( {
					select,
					context: blockContext,
				} );
				const field = fieldsList?.find(
					( f ) => f.value === binding.args?.key
				);
				fieldLabel = field?.label || '';
			}

			return {
				isBound: true,
				binding,
				source,
				isEditable,
				isValid,
				sourceLabel,
				fieldLabel,
				isBindable,
			};
		},
		[ fieldId, blockName, clientId, blockContext ]
	);
}
