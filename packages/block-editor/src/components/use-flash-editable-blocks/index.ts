import { useRefEffect } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import type { UseFlashEditableBlocksOptions } from './types';

export function useFlashEditableBlocks( {
	clientId = '',
	isEnabled = true,
}: UseFlashEditableBlocksOptions = {} ) {
	const { getEnabledClientIdsTree } = unlock( useSelect( blockEditorStore ) );

	return useRefEffect< HTMLElement >(
		( element ) => {
			if ( ! isEnabled ) {
				return;
			}

			const flashEditableBlocks = () => {
				getEnabledClientIdsTree( clientId ).forEach(
					( { clientId: id }: { clientId: string } ) => {
						const block = element.querySelector< HTMLElement >(
							`[data-block="${ id }"]`
						);
						if ( ! block ) {
							return;
						}
						block.classList.remove( 'has-editable-outline' );
						// Force reflow to trigger the animation.
						// eslint-disable-next-line no-unused-expressions
						block.offsetWidth;
						block.classList.add( 'has-editable-outline' );
					}
				);
			};

			const handleClick = ( event: MouseEvent ) => {
				const shouldFlash =
					event.target === element ||
					// Clicks target elements.
					( event.target as Element ).classList.contains(
						'is-root-container'
					);
				if ( ! shouldFlash ) {
					return;
				}
				if ( event.defaultPrevented ) {
					return;
				}
				event.preventDefault();
				flashEditableBlocks();
			};

			element.addEventListener( 'click', handleClick );
			return () => element.removeEventListener( 'click', handleClick );
		},
		[ isEnabled ]
	);
}
