/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

/**
 * Allows content only section editing to be exited by clicking outside of the
 * edited blocks.
 */
export function useEditContentOnlySectionExit() {
	const { getEditedContentOnlySection } = unlock(
		useSelect( blockEditorStore )
	);
	const { stopEditingContentOnlySection } = unlock(
		useDispatch( blockEditorStore )
	);

	return useRefEffect(
		( node ) => {
			function onClick( event ) {
				const editedContentOnlySection = getEditedContentOnlySection();
				if ( ! editedContentOnlySection ) {
					return;
				}

				// Check if the click is outside the edited block first.
				const isClickOutside = ! event.target.closest(
					`[data-block="${ editedContentOnlySection }"]`
				);

				// Only prevent default and stop editing if clicking outside.
				// This allows default behavior (e.g., file dialogs) to work when clicking inside.
				if ( isClickOutside && ! event.defaultPrevented ) {
					event.preventDefault();
					stopEditingContentOnlySection();
				}
			}

			node.addEventListener( 'click', onClick );

			return () => {
				node.removeEventListener( 'click', onClick );
			};
		},
		[ getEditedContentOnlySection, stopEditingContentOnlySection ]
	);
}
