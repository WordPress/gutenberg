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
import { useDebounce, useEvent, useInstanceId } from '@wordpress/compose';
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';
import useBlockDisplayInformation from '../use-block-display-information';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import { unlock } from '../../lock-unlock';

/**
 * Lists blocks so they can be selected from the inspector.
 *
 * @param {Object}   props                      Component props.
 * @param {string[]} [props.clientIds]          Client IDs of the blocks to list.
 * @param {Object[]} [props.tree]               Blocks nested under their groups,
 *                                              as returned by `getContentTree`.
 *                                              Takes precedence over `clientIds`.
 * @param {Function} [props.onSelect]           Called when a block is selected.
 * @param {Function} [props.onSwitchToListView] Shows a block in the List View tab.
 * @param {boolean}  [props.hasListViewTab]     Whether there's a List View tab.
 */
export default function BlockQuickNavigation( {
	clientIds = [],
	tree,
	...props
} ) {
	const nodes =
		tree ??
		clientIds.map( ( clientId ) => ( { clientId, innerBlocks: [] } ) );
	if ( ! nodes.length ) {
		return null;
	}
	return <BlockQuickNavigationList nodes={ nodes } { ...props } />;
}

function BlockQuickNavigationList( { nodes, ...props } ) {
	return (
		<VStack spacing={ 1 }>
			{ nodes.map( ( { clientId, innerBlocks } ) =>
				// Only groups have inner blocks: content blocks are listed flat.
				innerBlocks.length ? (
					<BlockQuickNavigationGroup
						key={ clientId }
						clientId={ clientId }
					>
						<BlockQuickNavigationList
							nodes={ innerBlocks }
							{ ...props }
						/>
					</BlockQuickNavigationGroup>
				) : (
					<BlockQuickNavigationItem
						key={ clientId }
						clientId={ clientId }
						{ ...props }
					/>
				)
			) }
		</VStack>
	);
}

/**
 * Highlights a block in the canvas while its item in the list is hovered or
 * focused.
 *
 * @param {string} clientId Client ID of the block.
 *
 * @return {Object} Event handlers for the item.
 */
function useBlockHighlight( clientId ) {
	const { toggleBlockHighlight } = useDispatch( blockEditorStore );

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

	return {
		onMouseEnter: highlightBlock,
		onMouseLeave: clearBlockHighlight,
		onFocus: highlightBlock,
		onBlur: clearBlockHighlight,
	};
}

/**
 * A group in a pattern: a heading that selects the group, and the content
 * that belongs to it.
 *
 * @param {Object}  props          Component props.
 * @param {string}  props.clientId Client ID of the group block.
 * @param {Element} props.children The group's content.
 */
function BlockQuickNavigationGroup( { clientId, children } ) {
	const headingId = useInstanceId(
		BlockQuickNavigationGroup,
		'block-editor-block-quick-navigation__group-heading'
	);
	const isSelected = useSelect(
		( select ) => select( blockEditorStore ).isBlockSelected( clientId ),
		[ clientId ]
	);
	const title = useBlockDisplayTitle( { clientId, context: 'list-view' } );
	const { selectBlock } = useDispatch( blockEditorStore );
	const highlightProps = useBlockHighlight( clientId );

	return (
		<div
			role="group"
			aria-labelledby={ headingId }
			className="block-editor-block-quick-navigation__group"
		>
			<Button
				id={ headingId }
				size="compact"
				className="block-editor-block-quick-navigation__group-heading"
				isPressed={ isSelected }
				onClick={ () => selectBlock( clientId ) }
				{ ...highlightProps }
			>
				<Truncate>{ title }</Truncate>
			</Button>
			<div className="block-editor-block-quick-navigation__group-content">
				{ children }
			</div>
		</div>
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
	const { selectBlock } = useDispatch( blockEditorStore );
	const highlightProps = useBlockHighlight( clientId );

	const hasChildren = childBlocks && childBlocks.length > 0;
	const canNavigateToListView =
		hasChildren && hasListViewTab && shouldRenderListView;

	return (
		<Button
			__next40pxDefaultSize
			className="block-editor-block-quick-navigation__item"
			isPressed={ isSelected }
			{ ...highlightProps }
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
