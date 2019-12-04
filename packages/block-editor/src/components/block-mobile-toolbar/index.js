/**
 * WordPress dependencies
 */
import { ifViewportMatches } from '@wordpress/viewport';

/**
 * Internal dependencies
 */
import BlockMover from '../block-mover';

function BlockMobileToolbar( { clientId, moverDirection } ) {
	return (
		<div className="block-editor-block-mobile-toolbar">
			<BlockMover clientIds={ [ clientId ] } __experimentalOrientation={ moverDirection } />
		</div>
	);
}

export default ifViewportMatches( '< small' )( BlockMobileToolbar );
