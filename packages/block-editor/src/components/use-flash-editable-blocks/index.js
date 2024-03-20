/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

function clamp( value, min, max ) {
	return Math.min( Math.max( value, min ), max );
}

function distanceFromRect( x, y, rect ) {
	const dx = x - clamp( x, rect.left, rect.right );
	const dy = y - clamp( y, rect.top, rect.bottom );
	return Math.sqrt( dx * dx + dy * dy );
}

export function useFlashEditableBlocks( {
	rootClientId = '',
	isEnabled = true,
} = {} ) {
	const { getEnabledClientIdsTree, getBlockName, getBlockOrder } = unlock(
		useSelect( blockEditorStore )
	);
	const { selectBlock } = useDispatch( blockEditorStore );

	return useRefEffect(
		( element ) => {
			if ( ! isEnabled ) {
				return;
			}

			const flashEditableBlocks = () => {
				getEnabledClientIdsTree( rootClientId ).forEach(
					( { clientId } ) => {
						const block = element.querySelector(
							`[data-block="${ clientId }"]`
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

			const selectClosestEditableBlock = ( x, y ) => {
				const editableBlockClientIds = getEnabledClientIdsTree(
					rootClientId
				).flatMap( ( { clientId } ) => {
					// TODO: We shouldn't be referencing a particular block in @wordpress/block-editor
					if ( getBlockName( clientId ) === 'core/post-content' ) {
						const innerBlocks = getBlockOrder( clientId );
						if ( innerBlocks.length ) {
							return innerBlocks;
						}
					}
					return [ clientId ];
				} );
				let closestDistance = Infinity,
					closestClientId = null;
				for ( const clientId of editableBlockClientIds ) {
					const block = element.querySelector(
						`[data-block="${ clientId }"]`
					);
					if ( ! block ) {
						continue;
					}
					const rect = block.getBoundingClientRect();
					const distance = distanceFromRect( x, y, rect );
					if ( distance < closestDistance ) {
						closestDistance = distance;
						closestClientId = clientId;
					}
				}
				if ( closestClientId ) {
					selectBlock( closestClientId );
				}
			};

			const handleClick = ( event ) => {
				const shouldFlash =
					event.target === element ||
					event.target.classList.contains( 'is-root-container' );
				if ( ! shouldFlash ) {
					return;
				}
				if ( event.defaultPrevented ) {
					return;
				}
				event.preventDefault();
				flashEditableBlocks();
				selectClosestEditableBlock( event.clientX, event.clientY );
			};

			element.addEventListener( 'click', handleClick );
			return () => element.removeEventListener( 'click', handleClick );
		},
		[ isEnabled ]
	);
}
