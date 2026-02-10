/**
 * WordPress dependencies
 */
import { hasBlockSupport, getBlockType } from '@wordpress/blocks';
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

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';
import useBlockDisplayInformation from '../use-block-display-information';

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
	const { isSelected, childBlocks, hasListViewSupport, blockName } =
		useSelect(
			( select ) => {
				const {
					isBlockSelected,
					hasSelectedInnerBlock,
					getBlockOrder,
					getBlockName,
				} = select( blockEditorStore );

				const _blockName = getBlockName( clientId );

				return {
					isSelected:
						isBlockSelected( clientId ) ||
						hasSelectedInnerBlock( clientId, /* deep: */ true ),
					childBlocks: getBlockOrder( clientId ),
					hasListViewSupport:
						_blockName === 'core/navigation' ||
						hasBlockSupport( _blockName, 'listView' ),
					blockName: _blockName,
				};
			},
			[ clientId ]
		);

	const blockType = getBlockType( blockName );
	const blockTitle = blockType?.title || blockName;
	const { selectBlock } = useDispatch( blockEditorStore );

	const hasChildren = childBlocks && childBlocks.length > 0;
	const canNavigateToListView =
		hasChildren && hasListViewTab && hasListViewSupport;

	return (
		<Button
			__next40pxDefaultSize
			className="block-editor-block-quick-navigation__item"
			isPressed={ isSelected }
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
