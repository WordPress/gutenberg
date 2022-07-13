/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useBlockEditContext } from '../block-edit';

/**
 * Returns the current value for a block attribute and a function to update it.
 * It automatically detects the block instance that should get updated based on the block edit context.
 *
 * @example
 *
 * ```jsx
 * import { useBlockAttribute } from '@wordpress/block-editor';
 * import { TextControl } from '@wordpress/components';
 *
 * function ContentInput() {
 *     const [ content, setContent ] = useBlockAttribute( 'content' );
 *     return (
 *         <TextControl value={ content } onChange={ setContent ) } />
 *     );
 * }
 * ```
 *
 * @param {string}   name        Attribute name.
 * @param {Function} [transform] Optional transform function applied when setting attribute value.
 *
 * @return {[*, Function]} A tuple of the current attribute value and a function to update it.
 */
export default function useBlockAttribute( name, transform ) {
	const { clientId } = useBlockEditContext();
	const currentValue = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );

			return getBlockAttributes( clientId )?.[ name ];
		},
		[ clientId, name ]
	);
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const setCurrentValue = useCallback(
		( newValue ) => {
			updateBlockAttributes( clientId, {
				[ name ]: transform ? transform( newValue ) : newValue,
			} );
		},
		[ updateBlockAttributes, transform ]
	);

	return [ currentValue, setCurrentValue ];
}
