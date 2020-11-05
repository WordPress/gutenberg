/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

function useBlockSelectionClearer() {
	const hasSelection = useSelect( ( select ) => {
		const { hasSelectedBlock, hasMultiSelection } = select(
			'core/block-editor'
		);

		return hasSelectedBlock() || hasMultiSelection();
	} );
	const { clearSelectedBlock } = useDispatch( 'core/block-editor' );

	return ( event ) => {
		if ( event.target === event.currentTarget && hasSelection ) {
			clearSelectedBlock();
		}
	};
}

export default function BlockSelectionClearer( props ) {
	const onFocus = useBlockSelectionClearer();
	return <div tabIndex={ -1 } onFocus={ onFocus } { ...props } />;
}
