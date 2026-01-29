/**
 * WordPress dependencies
 */
import {
	getBlockType,
	privateApis as blocksPrivateApis,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { getAllBlockBindingsSources, getBlockBindingsSourceFieldsList } =
	unlock( blocksPrivateApis );

/**
 * Get compatible binding sources/fields for a specific Block Field.
 *
 * @param {string} fieldId      The field/attribute identifier.
 * @param {string} blockName    The block type name.
 * @param {Object} blockContext The block context.
 * @param {Object} select       The select function from useSelect.
 * @return {Object} Object with source names as keys and compatible fields arrays as values.
 */
export function getCompatibleFields(
	fieldId,
	blockName,
	blockContext,
	select
) {
	const blockType = getBlockType( blockName );
	const attributeType = blockType?.attributes?.[ fieldId ]?.type;

	if ( ! attributeType ) {
		return {};
	}

	// Map Block Fields types to binding types
	const bindingType =
		attributeType === 'rich-text' ? 'string' : attributeType;

	const allSources = getAllBlockBindingsSources();
	const compatibleFields = {};

	Object.entries( allSources ).forEach( ( [ sourceName, source ] ) => {
		// Filter out pattern-overrides
		if ( sourceName === 'core/pattern-overrides' ) {
			return;
		}

		const fieldsList = getBlockBindingsSourceFieldsList(
			source,
			blockContext,
			select
		);

		if ( ! fieldsList?.length ) {
			return;
		}

		const compatible = fieldsList.filter(
			( field ) => field.type === bindingType
		);

		if ( compatible.length ) {
			compatibleFields[ sourceName ] = compatible;
		}
	} );

	return compatibleFields;
}
