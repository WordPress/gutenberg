import {
	Button,
	ToolbarButton,
	ToolbarGroup,
	ToolbarItem,
} from '@wordpress/components';
import type { IconType } from '@wordpress/components';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
} from '@wordpress/ui';
import { useDispatch, useSelect } from '@wordpress/data';
import { forwardRef, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { __, _x, sprintf } from '@wordpress/i18n';
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import { moreHorizontal, plus } from '@wordpress/icons';
import useBlockDisplayInformation from '../../use-block-display-information';
import useBlockDisplayTitle from '../../block-title/use-block-display-title';
import BlockIcon from '../../block-icon';
import Inserter from '../../inserter';
import { useShowHoveredOrFocusedGestures } from '../utils';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

/**
 * How far each level of the lineage menu is indented, in pixels.
 */
const LINEAGE_INDENT = 12;

function LineageItem( {
	clientId,
	depth,
}: {
	clientId: string;
	depth: number;
} ) {
	const { selectBlock } = useDispatch( blockEditorStore );
	const blockInformation = useBlockDisplayInformation( clientId );
	const name = useBlockDisplayTitle( {
		clientId,
		maximumLength: 35,
		context: 'list-view',
	} );
	const type = blockInformation?.title;
	return (
		<Menu.Item
			onClick={ () => selectBlock( clientId ) }
			prefix={
				depth === 0 && (
					<span className="block-editor-block-toolbar__menu-block-icon">
						<BlockIcon icon={ blockInformation?.icon } />
					</span>
				)
			}
			// The block type is only worth repeating next to a custom name.
			suffix={ name && type && name !== type ? type : undefined }
		>
			<Menu.ItemLabel>
				{ depth > 0 && (
					<span
						className="block-editor-block-toolbar__lineage-line"
						style={ { width: depth * LINEAGE_INDENT } }
						aria-hidden="true"
					/>
				) }
				{ name ?? type }
			</Menu.ItemLabel>
		</Menu.Item>
	);
}

/**
 * Lists every ancestor of the selected block, from the root down to the
 * immediate parent, indented to show nesting. Choosing one selects it.
 *
 * @param props           Component props.
 * @param props.ancestors The client IDs of the ancestors, root first.
 */
function LineageMenu( { ancestors }: { ancestors: string[] } ) {
	return (
		<Menu.Root
			// Like the other toolbar dropdowns, the menu does not trap focus.
			modal={ false }
		>
			<ToolbarItem>
				{ ( toolbarItemProps ) => (
					<Menu.Trigger
						{ ...toolbarItemProps }
						render={
							<Button
								size="compact"
								className="block-editor-block-toolbar__lineage-button"
								icon={ moreHorizontal }
								label={ __( 'Select a parent block' ) }
								showTooltip
							/>
						}
					/>
				) }
			</ToolbarItem>
			<Menu.Popup
				className="block-editor-block-toolbar__lineage-menu"
				width="md"
				positioner={
					<Menu.Positioner
						className="block-editor-block-toolbar__menu-positioner"
						side="top"
						align="start"
					/>
				}
			>
				{ ancestors.map( ( clientId, index ) => (
					<LineageItem
						key={ clientId }
						clientId={ clientId }
						depth={ index }
					/>
				) ) }
			</Menu.Popup>
		</Menu.Root>
	);
}

/**
 * The parent selector of the redesigned block toolbar. It sits outside the
 * block's footprint, to the left of the block toolbar, so the block toolbar
 * stays in the same place whatever the block hierarchy.
 */
const RedesignedBlockParentSelector = forwardRef< HTMLDivElement >(
	function BlockParentSelectorWithLineage( _props, ref ) {
		const { selectBlock } = useDispatch( blockEditorStore );
		const { parentClientId, ancestors, nextSiblingClientId, showInserter } =
			useSelect( ( select ) => {
				const {
					getBlockParents,
					getSelectedBlockClientIds,
					getParentSectionBlock,
					getEnabledBlockParents,
					getBlockName,
					getBlockListSettings,
					getNextBlockClientId,
					hasInserterItems,
				} = unlock( select( blockEditorStore ) );
				const [ selectedBlockClientId ] = getSelectedBlockClientIds();
				const parentSection = getParentSectionBlock(
					selectedBlockClientId
				);
				const parents = getBlockParents( selectedBlockClientId );
				const immediateParentClientId = parents[ parents.length - 1 ];
				// The ancestors shown in List View and the breadcrumb,
				// skipping any disabled blocks.
				const enabledParents: string[] = getEnabledBlockParents(
					selectedBlockClientId
				);
				const _parentClientId =
					enabledParents[ enabledParents.length - 1 ];
				const parentBlockType = getBlockType(
					getBlockName( _parentClientId )
				);
				// A wrapper that merges with the text flow (list, quote) grows
				// by typing: Enter continues it, and users know that.
				const isTextFlowWrapper =
					parentBlockType?.merge ||
					// A missing block type has no support.
					hasBlockSupport(
						parentBlockType as BlockType,
						'__experimentalOnMerge'
					);
				// Enter adds a sibling when a child splits, so the plus is
				// only for parents with an allowed list where no block splits.
				const allowedBlocks =
					getBlockListSettings( _parentClientId )?.allowedBlocks ??
					parentBlockType?.allowedBlocks;
				const allowsOnlyUnsplittable =
					Array.isArray( allowedBlocks ) &&
					allowedBlocks.every(
						( name ) => ! hasBlockSupport( name, 'splitting' )
					);
				return {
					parentClientId: _parentClientId,
					ancestors: enabledParents,
					nextSiblingClientId: getNextBlockClientId(
						selectedBlockClientId
					),
					showInserter:
						!! _parentClientId &&
						_parentClientId === immediateParentClientId &&
						! parentSection &&
						! isTextFlowWrapper &&
						allowsOnlyUnsplittable &&
						hasInserterItems( _parentClientId ),
				};
			}, [] );
		const blockInformation = useBlockDisplayInformation( parentClientId );

		// Highlights the parent block outline when focusing or hovering the
		// parent selector.
		const nodeRef = useRef< HTMLDivElement >( null );
		const showHoveredOrFocusedGestures = useShowHoveredOrFocusedGestures( {
			ref: nodeRef,
			highlightParent: true,
		} );
		const mergedRef = useMergeRefs( [ ref, nodeRef ] );

		return (
			<div
				className="block-editor-block-toolbar__parent-selector"
				key={ parentClientId }
				ref={ mergedRef }
				{ ...showHoveredOrFocusedGestures }
			>
				<ToolbarGroup>
					{ ancestors.length > 1 && (
						<LineageMenu ancestors={ ancestors } />
					) }
					<ToolbarButton
						className="block-editor-block-parent-selector__button"
						onClick={ () => selectBlock( parentClientId ) }
						label={ sprintf(
							/* translators: %s: Name of the block's parent. */
							__( 'Select parent block: %s' ),
							// The selector shows only for a parent, which has a title.
							blockInformation?.title as string
						) }
						showTooltip
						icon={ <BlockIcon icon={ blockInformation?.icon } /> }
					/>
					{ showInserter && (
						<Inserter
							position="bottom right"
							rootClientId={ parentClientId }
							clientId={ nextSiblingClientId }
							isAppender={ ! nextSiblingClientId }
							__experimentalIsQuick
							renderToggle={ ( {
								onToggle,
								isOpen,
								disabled,
								blockTitle,
								hasSingleBlockType,
							} ) => (
								<ToolbarButton
									className="block-editor-block-toolbar__sibling-inserter"
									onClick={ onToggle }
									aria-expanded={ isOpen }
									disabled={ disabled }
									label={
										hasSingleBlockType
											? sprintf(
													// translators: %s: the name of the block when there is only one
													_x(
														'Add %s',
														'directly add the only allowed block'
													),
													blockTitle.toLowerCase()
												)
											: _x(
													'Add block',
													'Generic label for block inserter button'
												)
									}
									showTooltip
									icon={ plus as IconType }
								/>
							) }
						/>
					) }
				</ToolbarGroup>
			</div>
		);
	}
);

export default RedesignedBlockParentSelector;
