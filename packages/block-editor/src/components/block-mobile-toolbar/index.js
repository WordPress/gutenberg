/**
 * WordPress dependencies
 */
import { ifViewportMatches } from '@wordpress/viewport';

/**
 * Internal dependencies
 */
import BlockMover from '../block-mover';

// This is a temporary fix for a couple of issues specific to Webkit on iOS.
// Without this fix the browser scrolls the mobile toolbar off-screen.
// Once supported in Safari we can replace this in favor of preventScroll.
// For details see issue #18632 and PR #18686
const isIphone = window.navigator.userAgent.indexOf( 'iPhone' ) !== -1;
if ( isIphone ) {
	document.addEventListener( 'focusin', function( ) {
		setTimeout( () => {
			window.scrollTo( 0, 0 );
		}, 150 );
	} );
}

function BlockMobileToolbar( { clientId, moverDirection } ) {
	return (
		<div className="block-editor-block-mobile-toolbar">
			<BlockMover clientIds={ [ clientId ] } __experimentalOrientation={ moverDirection } />
		</div>
	);
}

export default ifViewportMatches( '< small' )( BlockMobileToolbar );
