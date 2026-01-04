/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { DataForm } from '@wordpress/dataviews';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import { useBlockEditingMode } from '../components/block-editing-mode';
import { store as blockEditorStore } from '../store';
import { generateFieldsFromAttributes } from './generate-fields-from-attributes';

/**
 * Checks if a block has any attributes marked for auto-generated inspector controls.
 *
 * @param {Object} blockTypeAttributes - The block type's attributes object.
 * @return {boolean} True if any attribute has __experimentalAutoInspectorControl marker.
 */
function hasAutoInspectorControlAttributes( blockTypeAttributes ) {
	if ( ! blockTypeAttributes ) {
		return false;
	}
	return Object.values( blockTypeAttributes ).some(
		( attr ) => attr?.__experimentalAutoInspectorControl
	);
}

/**
 * Renders DataForm-based inspector controls for auto-registered PHP-only blocks.
 *
 * Fields are generated on-the-fly from attributes marked with `__experimentalAutoInspectorControl`
 * during PHP registration.
 *
 * @param {Object}   props               Component props.
 * @param {string}   props.name          Block name.
 * @param {string}   props.clientId      Block client ID.
 * @param {Function} props.setAttributes Function to update block attributes.
 */
function AutoRegisterControls( { name, clientId, setAttributes } ) {
	const blockEditingMode = useBlockEditingMode();

	const attributes = useSelect(
		( select ) => select( blockEditorStore ).getBlockAttributes( clientId ),
		[ clientId ]
	);

	const blockType = getBlockType( name );

	// Generate fields from user-defined attributes marked by PHP.
	// The __experimentalAutoInspectorControl marker excludes block support attributes
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
					data={ attributes }
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
	hasSupport( name ) {
		const blockType = getBlockType( name );
		return hasAutoInspectorControlAttributes( blockType?.attributes );
	},
};
