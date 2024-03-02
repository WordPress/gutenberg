/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
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
		const lastScrollTo = scrollRef?.lastScrollTo.current;
		const alreadyScrolledTo = lastScrollTo?.clientId === clientId;
		if (
			alreadyScrolledTo ||
			! isSelected ||
			! scrollRef ||
			! wasBlockJustInserted ||
			! isLayoutCalculated
		) {
			return;
		}
		scrollRef.scrollToElement( elementRef );
		lastScrollTo.clientId = clientId;
	}, [
		isSelected,
		scrollRef,
		wasBlockJustInserted,
		elementRef,
		isLayoutCalculated,
		clientId,
	] );
};

export default useScrollUponInsertion;
