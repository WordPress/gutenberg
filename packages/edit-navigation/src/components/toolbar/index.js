/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { NavigableToolbar, BlockToolbar } from '@wordpress/block-editor';
import { useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

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
	const hasSelection = useSelect( ( select ) => {
		const { hasSelectedBlock, hasMultiSelection } = select(
			'core/block-editor'
		);

		return hasSelectedBlock() || hasMultiSelection();
	} );

	const toolbarClasses = classnames( 'edit-navigation-toolbar__block-tools', {
		'has-block-selection': hasSelection,
	} );

	return (
		<div className="edit-navigation-toolbar" ref={ toolbarRef }>
			{ isPending ? (
				<Spinner />
			) : (
				<>
					<NavigableToolbar
						className={ toolbarClasses }
						aria-label={ __( 'Block tools' ) }
					>
						<BlockToolbar />
					</NavigableToolbar>
				</>
			) }
		</div>
	);
}
