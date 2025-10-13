/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useBlockBindingsUtils } from '@wordpress/block-editor';

/**
 * Builds entity binding configuration for navigation link URLs.
 * This function generates the structure used to bind navigation link URLs to their entity sources.
 *
 * Using a function instead of a constant allows for future enhancements where the binding
 * might need dynamic data (e.g., entity ID, context-specific arguments).
 *
 * @return {Object} Entity binding configuration object
 */
export function buildNavigationLinkEntityBinding() {
	return {
		url: {
			source,
			args: {
				key: 'link',
			},
		},
	};
}

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
		if ( hasUrlBinding ) {
			updateBlockBindings( { url: undefined } );
		}
	}, [ updateBlockBindings, hasUrlBinding, metadata, id ] );

	const createBinding = useCallback(
		( updatedAttributes ) => {
			// Use updated attributes if provided, otherwise fall back to closure attributes
			// updatedAttributes needed to access the most up-to-date data when called synchronously
			const kindToUse = updatedAttributes?.kind ?? kind;

			// Avoid creating binding if no kind is provided
			if ( ! kindToUse ) {
				return;
			}

			// Default to post-type in case there is a need to support dynamic kinds
			// in the future.
			const source =
				kindToUse === 'taxonomy' ? 'core/term-data' : 'core/post-data';

			updateBlockBindings( buildNavigationLinkEntityBinding() );
		},
		[ updateBlockBindings, kind, id ]
	);

	return {
		hasUrlBinding: hasCorrectBinding,
		clearBinding,
		createBinding,
	};
}
