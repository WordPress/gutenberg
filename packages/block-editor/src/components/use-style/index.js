/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../block-edit';
import { store as blockEditorStore } from '../../store';
import { getValueFromVariable } from '../../utils/style-variable-resolution';

/**
 * Hook that retrieves the global styles of a block.
 * It works with nested objects using by finding the value at path.
 *
 * @param {string|Array} path The path to the setting.
 *
 * @return {any} Returns the style value defined for the path.
 *
 * @example
 * ```js
 * const backgroundColor = useStyle( 'color.background' );
 * ```
 */
export default function useStyle( path ) {
	const { name: blockName } = useBlockEditContext();

	const settings = useSelect( ( select ) => {
		return select( blockEditorStore ).getSettings();
	}, [] );
	const settingsForBlock = get( settings, [
		'__experimentalStyles',
		'blocks',
		blockName,
	] );
	const value = get( settingsForBlock, path );
	return useMemo( () => {
		return getValueFromVariable(
			settings.__experimentalFeatures,
			blockName,
			value
		);
	}, [ settings.__experimentalFeatures, blockName, value ] );
}
