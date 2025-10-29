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
 * @param {('post-type'|'taxonomy')} kind - The kind of entity. Only 'post-type' and 'taxonomy' are supported.
 * @return {Object} Entity binding configuration object
 * @throws {Error} If kind is not 'post-type' or 'taxonomy'
 */
export function buildNavigationLinkEntityBinding( kind ) {
	// Validate kind parameter exists
	if ( kind === undefined ) {
		throw new Error(
			'buildNavigationLinkEntityBinding requires a kind parameter. ' +
				'Only "post-type" and "taxonomy" are supported.'
		);
	}

	// Validate kind parameter value
	if ( kind !== 'post-type' && kind !== 'taxonomy' ) {
		throw new Error(
			`Invalid kind "${ kind }" provided to buildNavigationLinkEntityBinding. ` +
				`Only 'post-type' and 'taxonomy' are supported.`
		);
	}

	const source = kind === 'taxonomy' ? 'core/term-data' : 'core/post-data';

	return {
		url: {
			source,
			args: {
				field: 'link',
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
	}, [ updateBlockBindings, hasUrlBinding ] );

	const createBinding = useCallback(
		( updatedAttributes ) => {
			// Use updated attributes if provided, otherwise fall back to closure attributes
			// updatedAttributes needed to access the most up-to-date data when called synchronously
			const kindToUse = updatedAttributes?.kind ?? kind;

			// Avoid creating binding if no kind is provided
			if ( ! kindToUse ) {
				return;
			}

			try {
				const binding = buildNavigationLinkEntityBinding( kindToUse );
				updateBlockBindings( binding );
			} catch ( error ) {
				// eslint-disable-next-line no-console
				console.warn(
					'Failed to create entity binding:',
					error.message
				);
				// Don't create binding if validation fails
			}
		},
		[ updateBlockBindings, kind, id ]
	);

	return {
		hasUrlBinding: hasCorrectBinding,
		clearBinding,
		createBinding,
	};
}
