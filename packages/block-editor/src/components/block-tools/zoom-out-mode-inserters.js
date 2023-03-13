/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockPopoverInbetween from '../block-popover/inbetween';
import { store as blockEditorStore } from '../../store';
import Inserter from '../inserter';

function ZoomOutModeInserters( { __unstableContentRef } ) {
	const [ isReady, setIsReady ] = useState( false );
	const blockOrder = useSelect( ( select ) => {
		return select( blockEditorStore ).getBlockOrder();
	}, [] );

	// Defer the initial rendering to avoid the jumps due to the animation.
	useEffect( () => {
		const timeout = setTimeout( () => {
			setIsReady( true );
		}, 500 );
		return () => {
			clearTimeout( timeout );
		};
	}, [] );

	if ( ! isReady ) {
		return null;
	}

	return blockOrder.map( ( clientId, index ) => {
		if ( index === blockOrder.length - 1 ) {
			return null;
		}
		return (
			<BlockPopoverInbetween
				key={ clientId }
				previousClientId={ clientId }
				nextClientId={ blockOrder[ index + 1 ] }
				__unstableContentRef={ __unstableContentRef }
			>
				<div className="block-editor-block-list__insertion-point-inserter is-with-inserter">
					<Inserter
						position="bottom center"
						clientId={ blockOrder[ index + 1 ] }
						__experimentalIsQuick
					/>
				</div>
			</BlockPopoverInbetween>
		);
	} );
}

export default ZoomOutModeInserters;
