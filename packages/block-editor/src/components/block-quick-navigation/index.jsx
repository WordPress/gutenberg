import { getBlockType } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	__experimentalVStack as VStack,
	__experimentalTruncate as Truncate,
	Flex,
	FlexBlock,
	FlexItem,
} from '@wordpress/components';
import { Icon, chevronRight } from '@wordpress/icons';
import { useEffect } from '@wordpress/element';
import { useDebounce, useEvent } from '@wordpress/compose';
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';
import useBlockDisplayInformation from '../use-block-display-information';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import { unlock } from '../../lock-unlock';

export default function BlockQuickNavigation( {
	clientIds,
	onSelect,
	onSwitchToListView,
	hasListViewTab,
} ) {
	if ( ! clientIds.length ) {
		return null;
	}
	return (
		<VStack spacing={ 1 }>
			{ clientIds.map( ( clientId ) => (
				<BlockQuickNavigationItem
					onSelect={ onSelect }
					onSwitchToListView={ onSwitchToListView }
					hasListViewTab={ hasListViewTab }
					key={ clientId }
					clientId={ clientId }
				/>
			) ) }
		</VStack>
	);
}

function BlockQuickNavigationItem( {
	clientId,
	onSelect,
	onSwitchToListView,
	hasListViewTab,
} ) {
	const blockInformation = useBlockDisplayInformation( clientId );
	const { isSelected, childBlocks, shouldRenderListView, blockName } =
		useSelect(
			( select ) => {
				const {
					isBlockSelected,
					hasSelectedInnerBlock,
					getBlockOrder,
					getBlockName,
					shouldRenderBlockListView,
				} = unlock( select( blockEditorStore ) );

				const _blockName = getBlockName( clientId );

				return {
					isSelected:
						isBlockSelected( clientId ) ||
						hasSelectedInnerBlock( clientId, /* deep: */ true ),
					childBlocks: getBlockOrder( clientId ),
					shouldRenderListView: shouldRenderBlockListView( clientId ),
					blockName: _blockName,
				};
			},
			[ clientId ]
		);

	const blockType = getBlockType( blockName );
	const displayTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );
	const blockTitle = displayTitle || blockType?.title || blockName;
	const { selectBlock, toggleBlockHighlight } =
		useDispatch( blockEditorStore );

	// Debounced, as in the List View, so sweeping the pointer down the list
	// does not dispatch for every item it crosses.
	const debouncedToggleBlockHighlight = useDebounce(
		toggleBlockHighlight,
		50
	);
	const highlightBlock = useEvent( () =>
		debouncedToggleBlockHighlight( clientId, true )
	);
	const clearBlockHighlight = useEvent( () =>
		debouncedToggleBlockHighlight( clientId, false )
	);

	// Selecting an item can switch the inspector to the List View tab, which
	// unmounts this panel before the pointer leaves, so `onMouseLeave` never
	// runs and the highlight would stick.
	const clearBlockHighlightOnUnmount = useEvent( () =>
		toggleBlockHighlight( clientId, false )
	);
	useEffect(
		() => () => clearBlockHighlightOnUnmount(),
		[ clearBlockHighlightOnUnmount ]
	);

	const hasChildren = childBlocks && childBlocks.length > 0;
	const canNavigateToListView =
		hasChildren && hasListViewTab && shouldRenderListView;

	return (
		<Button
			__next40pxDefaultSize
			className="block-editor-block-quick-navigation__item"
			isPressed={ isSelected }
			onMouseEnter={ highlightBlock }
			onMouseLeave={ clearBlockHighlight }
			onFocus={ highlightBlock }
			onBlur={ clearBlockHighlight }
			onClick={ async () => {
				await selectBlock( clientId );

				// If the block has children and List View is available,
				// switch to List View to show the expanded container.
				if ( canNavigateToListView && onSwitchToListView ) {
					onSwitchToListView( clientId );
				}

				if ( onSelect ) {
					onSelect( clientId );
				}
			} }
		>
			<Flex>
				<FlexItem>
					<BlockIcon icon={ blockInformation?.icon } />
				</FlexItem>
				<FlexBlock style={ { textAlign: 'left' } }>
					<Truncate>{ blockTitle }</Truncate>
				</FlexBlock>
				{ canNavigateToListView && (
					<FlexItem>
						<Icon icon={ chevronRight } size={ 24 } />
					</FlexItem>
				) }
			</Flex>
		</Button>
	);
}
