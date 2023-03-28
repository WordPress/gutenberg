/**
 * WordPress dependencies
 */
import {
	__experimentalTreeGridRow as TreeGridRow,
	__experimentalTreeGridCell as TreeGridCell,
} from '@wordpress/components';
import { memo } from '@wordpress/element';
import { AsyncModeProvider, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { Appender } from './appender';
import ListViewBlock from './block';
import { useListViewContext } from './context';
import { isClientIdSelected } from './utils';
import { store as blockEditorStore } from '../../store';
import useBlockDisplayInformation from '../use-block-display-information';

/**
 * Given a block, returns the total number of blocks in that subtree. This is used to help determine
 * the list position of a block.
 *
 * When a block is collapsed, we do not count their children as part of that total. In the current drag
 * implementation dragged blocks and their children are not counted.
 *
 * @param {Object}  block               block tree
 * @param {Object}  expandedState       state that notes which branches are collapsed
 * @param {Array}   draggedClientIds    a list of dragged client ids
 * @param {boolean} isExpandedByDefault flag to determine the default fallback expanded state.
 * @return {number} block count
 */
function countBlocks(
	block,
	expandedState,
	draggedClientIds,
	isExpandedByDefault
) {
	const isDragged = draggedClientIds?.includes( block.clientId );
	if ( isDragged ) {
		return 0;
	}
	const isExpanded = expandedState[ block.clientId ] ?? isExpandedByDefault;

	if ( isExpanded ) {
		return (
			1 +
			block.innerBlocks.reduce(
				countReducer(
					expandedState,
					draggedClientIds,
					isExpandedByDefault
				),
				0
			)
		);
	}
	return 1;
}
const countReducer =
	( expandedState, draggedClientIds, isExpandedByDefault ) =>
	( count, block ) => {
		const isDragged = draggedClientIds?.includes( block.clientId );
		if ( isDragged ) {
			return count;
		}
		const isExpanded =
			expandedState[ block.clientId ] ?? isExpandedByDefault;
		if ( isExpanded && block.innerBlocks.length > 0 ) {
			return (
				count +
				countBlocks(
					block,
					expandedState,
					draggedClientIds,
					isExpandedByDefault
				)
			);
		}
		return count + 1;
	};

const noop = () => {};

function ListViewBranch( props ) {
	const {
		blocks,
		selectBlock = noop,
		showBlockMovers,
		selectedClientIds,
		level = 1,
		path = '',
		isBranchSelected = false,
		listPosition = 0,
		fixedListWindow,
		isExpanded,
		parentId,
		shouldShowInnerBlocks = true,
		isSyncedBranch = false,
		showAppender: showAppenderProp = true,
	} = props;

	const parentBlockInformation = useBlockDisplayInformation( parentId );
	const syncedBranch = isSyncedBranch || !! parentBlockInformation?.isSynced;

	const canParentExpand = useSelect(
		( select ) => {
			if ( ! parentId ) {
				return true;
			}

			const isContentLocked =
				select( blockEditorStore ).getTemplateLock( parentId ) ===
				'contentOnly';
			const canEdit = select( blockEditorStore ).canEditBlock( parentId );

			return isContentLocked ? false : canEdit;
		},
		[ parentId ]
	);

	const { expandedState, draggedClientIds } = useListViewContext();

	if ( ! canParentExpand ) {
		return null;
	}

	// Only show the appender at the first level.
	const showAppender = showAppenderProp && level === 1;
	const filteredBlocks = blocks.filter( Boolean );
	const blockCount = filteredBlocks.length;
	// The appender means an extra row in List View, so add 1 to the row count.
	const rowCount = showAppender ? blockCount + 1 : blockCount;
	let nextPosition = listPosition;

	return (
		<>
			{ filteredBlocks.map( ( block, index ) => {
				const { clientId, innerBlocks } = block;

				if ( index > 0 ) {
					nextPosition += countBlocks(
						filteredBlocks[ index - 1 ],
						expandedState,
						draggedClientIds,
						isExpanded
					);
				}

				const { itemInView } = fixedListWindow;
				const blockInView = itemInView( nextPosition );

				const position = index + 1;
				const updatedPath =
					path.length > 0
						? `${ path }_${ position }`
						: `${ position }`;
				const hasNestedBlocks = !! innerBlocks?.length;

				const shouldExpand =
					hasNestedBlocks && shouldShowInnerBlocks
						? expandedState[ clientId ] ?? isExpanded
						: undefined;

				const isDragged = !! draggedClientIds?.includes( clientId );

				// Make updates to the selected or dragged blocks synchronous,
				// but asynchronous for any other block.
				const isSelected = isClientIdSelected(
					clientId,
					selectedClientIds
				);
				const isSelectedBranch =
					isBranchSelected || ( isSelected && hasNestedBlocks );
				const showBlock = isDragged || blockInView || isSelected;
				return (
					<AsyncModeProvider key={ clientId } value={ ! isSelected }>
						{ showBlock && (
							<ListViewBlock
								block={ block }
								selectBlock={ selectBlock }
								isSelected={ isSelected }
								isBranchSelected={ isSelectedBranch }
								isDragged={ isDragged }
								level={ level }
								position={ position }
								rowCount={ rowCount }
								siblingBlockCount={ blockCount }
								showBlockMovers={ showBlockMovers }
								path={ updatedPath }
								isExpanded={ shouldExpand }
								listPosition={ nextPosition }
								selectedClientIds={ selectedClientIds }
								isSyncedBranch={ syncedBranch }
							/>
						) }
						{ ! showBlock && (
							<tr>
								<td className="block-editor-list-view-placeholder" />
							</tr>
						) }
						{ hasNestedBlocks && shouldExpand && ! isDragged && (
							<ListViewBranch
								parentId={ clientId }
								blocks={ innerBlocks }
								selectBlock={ selectBlock }
								showBlockMovers={ showBlockMovers }
								level={ level + 1 }
								path={ updatedPath }
								listPosition={ nextPosition + 1 }
								fixedListWindow={ fixedListWindow }
								isBranchSelected={ isSelectedBranch }
								selectedClientIds={ selectedClientIds }
								isExpanded={ isExpanded }
								isSyncedBranch={ syncedBranch }
							/>
						) }
					</AsyncModeProvider>
				);
			} ) }
			{ showAppender && (
				<TreeGridRow
					level={ level }
					setSize={ rowCount }
					positionInSet={ rowCount }
					isExpanded={ true }
				>
					<TreeGridCell>
						{ ( treeGridCellProps ) => (
							<Appender
								clientId={ parentId }
								nestingLevel={ level }
								blockCount={ blockCount }
								{ ...treeGridCellProps }
							/>
						) }
					</TreeGridCell>
				</TreeGridRow>
			) }
		</>
	);
}

export default memo( ListViewBranch );
