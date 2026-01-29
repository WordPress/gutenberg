/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const DISTANCE_THRESHOLD = 500;

function clamp( value, min, max ) {
	return Math.min( Math.max( value, min ), max );
}

function distanceFromRect( x, y, rect ) {
	const dx = x - clamp( x, rect.left, rect.right );
	const dy = y - clamp( y, rect.top, rect.bottom );
	return Math.sqrt( dx * dx + dy * dy );
}

export default function useSelectNearestEditableBlock( {
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

			const selectNearestEditableBlock = ( x, y ) => {
				const editableBlockClientIds =
					getEnabledClientIdsTree().flatMap( ( { clientId } ) => {
						const blockName = getBlockName( clientId );
						if ( blockName === 'core/template-part' ) {
							return [];
						}
						if ( blockName === 'core/post-content' ) {
							const innerBlocks = getBlockOrder( clientId );
							if ( innerBlocks.length ) {
								return innerBlocks;
							}
						}
						return [ clientId ];
					} );

				let nearestDistance = Infinity,
					nearestClientId = null;

				for ( const clientId of editableBlockClientIds ) {
					const block = element.querySelector(
						`[data-block="${ clientId }"]`
					);
					if ( ! block ) {
						continue;
					}
					const rect = block.getBoundingClientRect();
					const distance = distanceFromRect( x, y, rect );
					if (
						distance < nearestDistance &&
						distance < DISTANCE_THRESHOLD
					) {
						nearestDistance = distance;
						nearestClientId = clientId;
					}
				}

				if ( nearestClientId ) {
					selectBlock( nearestClientId );
				}
			};

			const handleClick = ( event ) => {
				const shouldSelect =
					event.target === element ||
					event.target.classList.contains( 'is-root-container' );
				if ( shouldSelect ) {
					selectNearestEditableBlock( event.clientX, event.clientY );
				}
			};

			element.addEventListener( 'click', handleClick );
			return () => element.removeEventListener( 'click', handleClick );
		},
		[ isEnabled ]
	);
}
