import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as blocksStore } from '@wordpress/blocks';
import { PAGE_LIST_ITEM } from './utils';

/**
 * Returns the blocks that can go in a Page List, or in one of its pages, in a
 * Navigation block: its pages, and so that it can be asked to detach, the
 * Navigation block's other items. In a pages menu, a Navigation block whose
 * only item is the Page List, and elsewhere, only its pages.
 *
 * @param isChildOfNavigation Whether it's in a Navigation block.
 * @param isPagesOnly         Whether that Navigation block is a pages menu.
 *
 * @return Names of the allowed blocks.
 */
export function usePageListAllowedBlocks(
	isChildOfNavigation: boolean,
	isPagesOnly: boolean
): string[] {
	const navigationAllowedBlocks = useSelect(
		( select ) =>
			isChildOfNavigation && ! isPagesOnly
				? ( select( blocksStore ).getBlockType( 'core/navigation' )
						?.allowedBlocks as string[] | undefined )
				: undefined,
		[ isChildOfNavigation, isPagesOnly ]
	);
	return useMemo(
		() => [
			PAGE_LIST_ITEM,
			...( navigationAllowedBlocks ?? [] ).filter(
				( name ) => name !== 'core/page-list' && name !== PAGE_LIST_ITEM
			),
		],
		[ navigationAllowedBlocks ]
	);
}
