/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { NavigableToolbar, BlockToolbar } from '@wordpress/block-editor';
import { useEffect, useRef } from '@wordpress/element';

function stopPropagation( event ) {
	event.stopPropagation();
}

// Hack: Stop useBlockSelectionClearer from clearing block selection when the
// block toolbar is clicked.
function useStopMouseDownPropagation( ref ) {
	useEffect( () => {
		ref.current.addEventListener( 'mousedown', stopPropagation );
		return () =>
			ref.current.removeEventListener( 'mousedown', stopPropagation );
	}, [] );
}

export default function Toolbar( { isPending } ) {
	const toolbarRef = useRef();
	useStopMouseDownPropagation( toolbarRef );
	return (
		<div className="edit-navigation-toolbar" ref={ toolbarRef }>
			{ isPending ? (
				<Spinner />
			) : (
				<>
					<NavigableToolbar
						className="edit-navigation-toolbar__block-tools"
						aria-label={ __( 'Block tools' ) }
					>
						<BlockToolbar />
					</NavigableToolbar>
				</>
			) }
		</div>
	);
}
