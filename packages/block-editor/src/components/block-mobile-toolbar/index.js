/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockMover from '../block-mover';

function BlockMobileToolbar( { clientId, moverDirection } ) {
	const isMobile = useViewportMatch( 'small', '<' );
	if ( ! isMobile ) {
		return null;
	}

	return (
		<div className="block-editor-block-mobile-toolbar">
			<BlockMover clientIds={ [ clientId ] } __experimentalOrientation={ moverDirection } />
		</div>
	);
}

export default BlockMobileToolbar;
