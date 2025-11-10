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

				if ( ! event.defaultPrevented ) {
					event.preventDefault();

					// If the user clicks outside the edited block, stop editing.
					if (
						! event.target.closest(
							`[data-block="${ editedContentOnlySection }"]`
						)
					) {
						stopEditingContentOnlySection();
					}
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
