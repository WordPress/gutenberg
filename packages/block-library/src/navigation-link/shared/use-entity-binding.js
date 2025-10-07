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
	const { updateBlockBindings, removeBlockBinding } =
		useBlockBindingsUtils( clientId );
	const { metadata, id } = attributes;

	// Check if there's a URL binding with a valid source (not null)
	const hasUrlBinding = !! metadata?.bindings?.url?.source && !! id;

	// Check if there's ANY binding metadata (even if cleared/null)
	const hasBindingMetadata = !! metadata?.bindings?.url;

	const clearBinding = useCallback( () => {
		// Only clear if there's actually a binding to clear
		if ( hasBindingMetadata ) {
			// Remove the URL binding
			removeBlockBinding( 'url' );
		}
	}, [ hasBindingMetadata, removeBlockBinding ] );

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
