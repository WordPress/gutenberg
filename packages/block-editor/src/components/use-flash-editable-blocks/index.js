/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function useFlashEditableBlocks( rootClientId = '' ) {
	const { getEnabledClientIdsTree } = unlock( useSelect( blockEditorStore ) );

	return useRefEffect( ( element ) => {
		const flashEditableBlocks = () => {
			getEnabledClientIdsTree( rootClientId ).forEach(
				( { clientId } ) => {
					const blockElement = element.querySelector(
						`[data-block="${ clientId }"]`
					);
					if ( ! blockElement ) {
						return;
					}
					blockElement.classList.remove( 'has-editable-outline' );
					// Force reflow to trigger the animation.
					// eslint-disable-next-line no-unused-expressions
					blockElement.offsetWidth;
					blockElement.classList.add( 'has-editable-outline' );
				}
			);
		};

		const handleClick = ( event ) => {
			if ( event.defaultPrevented ) {
				return;
			}
			event.preventDefault();
			flashEditableBlocks();
		};

		element.addEventListener( 'click', handleClick );
		return () => {
			element.removeEventListener( 'click', handleClick );
		};
	} );
}
