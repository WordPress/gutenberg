/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';

export function useBlockSelectionClearer( ref ) {
	const hasSelection = useSelect( ( select ) => {
		const { hasSelectedBlock, hasMultiSelection } = select(
			'core/block-editor'
		);

		return hasSelectedBlock() || hasMultiSelection();
	} );
	const { clearSelectedBlock } = useDispatch( 'core/block-editor' );

	useEffect( () => {
		if ( ! hasSelection ) {
			return;
		}

		function onFocus() {
			clearSelectedBlock();
		}

		ref.current.addEventListener( 'focus', onFocus );

		return () => {
			ref.current.removeEventListener( 'focus', onFocus );
		};
	}, [ hasSelection, clearSelectedBlock ] );
}

export default function BlockSelectionClearer( props ) {
	const ref = useRef();
	useBlockSelectionClearer( ref );
	return <div tabIndex={ -1 } ref={ ref } { ...props } />;
}
