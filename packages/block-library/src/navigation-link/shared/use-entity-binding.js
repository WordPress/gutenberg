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
	const { metadata, id } = attributes;

	const hasUrlBinding = !! metadata?.bindings?.url && !! id;

	const clearBinding = useCallback( () => {
		updateBlockBindings( {
			url: {
				source: null,
				args: null,
			},
		} );
	}, [ updateBlockBindings ] );

	const createBinding = useCallback( () => {
		updateBlockBindings( {
			url: {
				source: 'core/entity',
				args: {
					key: 'url',
				},
			},
		} );
	}, [ updateBlockBindings ] );

	return {
		hasUrlBinding,
		clearBinding,
		createBinding,
	};
}
