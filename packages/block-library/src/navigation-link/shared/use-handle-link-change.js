/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { escapeHTML } from '@wordpress/escape-html';

/**
 * Internal dependencies
 */
import { updateAttributes } from './update-attributes';
import { useEntityBinding } from './use-entity-binding';

/**
 * Custom hook that returns a callback for handling link selection/change.
 * Manages the transition between entity links and custom links,
 * including proper binding creation and cleanup.
 *
 * @param {Object}   options                 - Configuration options
 * @param {string}   options.clientId        - Block client ID
 * @param {Object}   options.attributes      - Current block attributes
 * @param {Function} options.setAttributes   - Standard setAttribute function
 * @param {boolean}  options.allowTextUpdate - Whether this control can update the link text
 * @return {Function} Callback function to handle link changes
 */
export function useHandleLinkChange( {
	clientId,
	attributes,
	setAttributes,
	allowTextUpdate = false,
} ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { hasUrlBinding, createBinding, clearBinding } = useEntityBinding( {
		clientId,
		attributes,
	} );

	return useCallback(
		( updatedLink ) => {
			if ( ! updatedLink ) {
				return;
			}

			const attrs = {
				url: updatedLink.url,
				kind: updatedLink.kind,
				type: updatedLink.type,
				id: updatedLink.id,
			};

			const currentText = attributes.label
				? stripHTML( attributes.label )
				: '';
			const updatedText = updatedLink.title ?? '';
			const hasTextUpdate =
				allowTextUpdate &&
				updatedLink.title !== undefined &&
				updatedText !== currentText;
			const textUpdateAttributes = hasTextUpdate
				? { label: escapeHTML( updatedText ) }
				: {};

			if (
				! attributes.label ||
				attributes.label === '' ||
				hasTextUpdate
			) {
				attrs.title = updatedLink.title;
			}
			// Check if transitioning from entity to custom link
			const willBeCustomLink = ! updatedLink.id && hasUrlBinding;

			if ( willBeCustomLink ) {
				// Clear the binding first
				clearBinding();

				// Use direct store dispatch to bypass setBoundAttributes wrapper
				// which prevents updates to bound attributes.
				updateBlockAttributes( clientId, {
					url: updatedLink.url,
					kind: 'custom',
					type: 'custom',
					id: undefined,
					...textUpdateAttributes,
				} );
			} else {
				// Normal flow for entity links or unbound custom links
				const { isEntityLink, attributes: updatedAttributes } =
					updateAttributes( attrs, setAttributes, attributes );

				// Handle URL binding based on the final computed state
				// Only create bindings for entity links (posts, pages, taxonomies)
				// Never create bindings for custom links (manual URLs)
				if ( isEntityLink ) {
					createBinding( updatedAttributes );
				} else {
					clearBinding();
				}

				if ( Object.keys( textUpdateAttributes ).length ) {
					updateBlockAttributes( clientId, textUpdateAttributes );
				}
			}
		},
		[
			attributes,
			allowTextUpdate,
			clientId,
			hasUrlBinding,
			createBinding,
			clearBinding,
			setAttributes,
			updateBlockAttributes,
		]
	);
}
