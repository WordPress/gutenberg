/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useBlockBindingsUtils } from '@wordpress/block-editor';

/**
 * Shared hook for entity binding functionality in Navigation blocks.
 *
 * This hook provides common entity binding logic that can be used by both
 * Navigation Link and Navigation Submenu blocks to maintain feature parity.
 *
 * @param {Object} props            - Hook parameters
 * @param {string} props.clientId   - Block client ID
 * @param {Object} props.attributes - Block attributes
 * @return {Object} Hook return value
 */
export function useEntityBinding( { clientId, attributes } ) {
	const { updateBlockBindings } = useBlockBindingsUtils( clientId );
	const { metadata, id, kind } = attributes;

	const hasUrlBinding = !! metadata?.bindings?.url && !! id;
	const expectedSource =
		kind === 'post-type' ? 'core/post-data' : 'core/term-data';
	const hasCorrectBinding =
		hasUrlBinding && metadata?.bindings?.url?.source === expectedSource;

	const clearBinding = useCallback( () => {
		// Only clear if there's actually a valid binding to clear
		if ( hasCorrectBinding ) {
			// Remove the URL binding by setting it to undefined
			updateBlockBindings( { url: undefined } );
		}
	}, [ hasCorrectBinding, updateBlockBindings ] );

	const createBinding = useCallback( () => {
		const source =
			kind === 'post-type' ? 'core/post-data' : 'core/term-data';
		updateBlockBindings( {
			url: {
				source,
				args: {
					key: 'link',
				},
			},
		} );
	}, [ updateBlockBindings, kind ] );

	return {
		hasUrlBinding: hasCorrectBinding,
		clearBinding,
		createBinding,
	};
}
