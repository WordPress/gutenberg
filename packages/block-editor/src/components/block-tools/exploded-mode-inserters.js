/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockPopoverInbetween from '../block-popover/inbetween';
import { store as blockEditorStore } from '../../store';
import Inserter from '../inserter';

function ExplodedModeInserters( { __unstableContentRef } ) {
	const blockOrder = useSelect( ( select ) => {
		return select( blockEditorStore ).getBlockOrder();
	}, [] );

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
				<div className="block-editor-block-list__insertion-point-inserter">
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

export default ExplodedModeInserters;
