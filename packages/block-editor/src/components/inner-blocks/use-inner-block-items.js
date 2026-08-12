import { useSelect, AsyncModeProvider } from '@wordpress/data';
import { __unstableGetInnerBlocks as getInnerBlocks } from '@wordpress/blocks';
import { store as blockEditorStore } from '../../store';
import { useBlockEditContext } from '../block-edit/context';
import { LayoutProvider, defaultLayout } from '../block-list/layout';
import BlockListBlock from '../block-list/block';
import { unlock } from '../../lock-unlock';

const EMPTY_ARRAY = [];
const EMPTY_SET = new Set();

/**
 * Hook that returns inner blocks as an array of renderable items.
 *
 * Unlike `useInnerBlocksProps` which returns an opaque `children` prop,
 * this hook returns individual block elements that the parent can place
 * anywhere in its JSX tree. This enables custom DOM structures like
 * `<table><tr><td>` where child blocks need to be rendered inside
 * intermediary elements.
 *
 * Should be used alongside `useInnerBlocksProps` which handles infrastructure
 * setup (drop zones, nested settings, template sync, layout classes).
 *
 * @return {Array} Array of React elements, one per inner block.
 */
export function useInnerBlockItems() {
	const { clientId, layout } = useBlockEditContext();

	const { order, selectedBlocks, visibleBlocks } = useSelect(
		( select ) => {
			const {
				getBlockOrder,
				getSelectedBlockClientIds,
				__unstableGetVisibleBlocks,
				getSettings,
			} = unlock( select( blockEditorStore ) );

			const _order = getBlockOrder( clientId );

			if ( getSettings().isPreviewMode ) {
				return {
					order: _order,
					selectedBlocks: EMPTY_ARRAY,
					visibleBlocks: EMPTY_SET,
				};
			}

			return {
				order: _order,
				selectedBlocks: getSelectedBlockClientIds(),
				visibleBlocks: __unstableGetVisibleBlocks(),
			};
		},
		[ clientId ]
	);

	const usedLayout = layout || defaultLayout;

	return order.map( ( innerClientId ) => (
		<AsyncModeProvider
			key={ innerClientId }
			value={
				! visibleBlocks.has( innerClientId ) &&
				! selectedBlocks.includes( innerClientId )
			}
		>
			<LayoutProvider value={ usedLayout }>
				<BlockListBlock
					rootClientId={ clientId }
					clientId={ innerClientId }
				/>
			</LayoutProvider>
		</AsyncModeProvider>
	) );
}

/**
 * Save-context companion to `useInnerBlockItems`.
 *
 * Returns the inner blocks array from the current save context. Reads from
 * the same module-level provider as `useInnerBlocksProps.save`, so it works
 * during block validation where the `innerBlocks` function parameter is not
 * passed.
 *
 * @return {Array} Inner blocks array.
 */
useInnerBlockItems.save = function () {
	return getInnerBlocks();
};
