/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Retrieves the selected block clientId
 *
 * @return {string} Block clientId.
 */
export function useSelectedBlockClientId() {
	const clientId = useSelect( ( select ) => {
		const { getSelectedBlockClientId } = select( 'core/block-editor' );
		return getSelectedBlockClientId();
	}, [] );

	return clientId;
}

/**
 * Retrieves setAttributes callback for the selected block.
 *
 * @return {Function} setAttributes callback.
 */
export function useSetAttributes() {
	const clientId = useSelectedBlockClientId();
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	const setAttributes = useCallback(
		( newAttributes ) => {
			updateBlockAttributes( clientId, newAttributes );
		},
		[ clientId ]
	);

	return setAttributes;
}

/**
 * Retrieves the selected block attributes
 *
 * @return {Object} Block attributes.
 */
export function useBlockAttributes() {
	const clientId = useSelectedBlockClientId();
	const { attributes } = useSelect( ( select ) => {
		const { __unstableGetBlockWithoutInnerBlocks } = select(
			'core/block-editor'
		);
		return __unstableGetBlockWithoutInnerBlocks( clientId ) || {};
	}, [] );

	return attributes || {};
}

/**
 * Retrieves the attributes and setAttributes callback from the selected block.
 *
 * @return {Array<Object, Function>} [attributes, setAttributes]
 */
export function useBlockEditProps() {
	const attributes = useBlockAttributes();
	const setAttributes = useSetAttributes();

	return [ attributes, setAttributes ];
}
