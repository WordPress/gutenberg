/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useBlockListContext } from './block-list-context';
import { store as blockEditorStore } from '../../store';

const useScrollUponInsertion = ( {
	clientId,
	isSelected,
	isLayoutCalculated,
	elementRef,
} ) => {
	const isAlreadyInserted = useRef( false );
	const { scrollRef } = useBlockListContext();
	const wasBlockJustInserted = useSelect(
		( select ) =>
			!! select( blockEditorStore ).wasBlockJustInserted(
				clientId,
				'inserter_menu'
			),
		[ clientId ]
	);
	useEffect( () => {
		const blockJustInserted =
			! isAlreadyInserted.current && wasBlockJustInserted;
		if (
			! isSelected ||
			! scrollRef ||
			! blockJustInserted ||
			! isLayoutCalculated
		) {
			return;
		}
		scrollRef.scrollToElement( elementRef );
		isAlreadyInserted.current = wasBlockJustInserted;
	}, [
		isSelected,
		scrollRef,
		wasBlockJustInserted,
		elementRef,
		isLayoutCalculated,
	] );
};

export default useScrollUponInsertion;
