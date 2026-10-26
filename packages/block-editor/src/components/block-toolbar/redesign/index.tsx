import { ToolbarGroup } from '@wordpress/components';
import { getScrollContainer } from '@wordpress/dom';
import { useLayoutEffect, useRef, useState } from '@wordpress/element';
import type { HTMLAttributes, RefObject } from 'react';
import BlockControls from '../../block-controls';
import BlockEditVisuallyButton from '../../block-edit-visually-button';
import { ViewportVisibilityToolbar } from '../../block-visibility';
import { useBlockElement } from '../../block-list/use-block-props/use-block-refs';
import __unstableBlockToolbarLastItem from '../block-toolbar-last-item';
import ChangeDesign from '../change-design';
import SwitchSectionStyle from '../switch-section-style';
import EditSectionButton from '../edit-section-button';
import BlockNameMenu from './block-name-menu';
import RedesignedBlockMover from './block-mover';
import BlockOptionsMenu from './options-menu';
import { BlockOptionsMenuItemsSlot } from './options-menu-item';
import ContainerActions from './layout-menu';
import RedesignedBlockParentSelector from './parent-selector';
import RemoveBlockButton from './remove-block-button';

/**
 * The gap between the parent selector and the block toolbar, in pixels.
 */
const PARENT_SELECTOR_GAP = 8;

/**
 * Whether the parent selector would be cut off at the start of the canvas if
 * it sat outside the block. Then the block toolbar moves over to make room,
 * as it is the only case where it moves.
 *
 * @param blockClientId     The client ID of the selected block.
 * @param parentSelectorRef The parent selector element.
 * @param isEnabled         Whether the parent selector sits outside the block.
 * @return The width to make room for, or 0 when there is room.
 */
function useParentSelectorOverflow(
	blockClientId: string | undefined,
	parentSelectorRef: RefObject< HTMLDivElement | null >,
	isEnabled: boolean
) {
	const blockElement = useBlockElement( blockClientId ?? '' );
	const [ overflowWidth, setOverflowWidth ] = useState( 0 );

	useLayoutEffect( () => {
		const parentSelector = parentSelectorRef.current;
		if ( ! isEnabled || ! blockElement || ! parentSelector ) {
			setOverflowWidth( 0 );
			return;
		}

		function update() {
			if ( ! blockElement || ! parentSelector ) {
				return;
			}
			const neededWidth =
				parentSelector.offsetWidth + PARENT_SELECTOR_GAP;
			const blockView = blockElement.ownerDocument.defaultView;
			// In an iframe, the canvas starts at the edge of the frame.
			const boundary = blockView?.frameElement
				? 0
				: ( getScrollContainer( blockElement )?.getBoundingClientRect()
						.left ?? 0 );
			const availableWidth =
				blockElement.getBoundingClientRect().left - boundary;
			setOverflowWidth( availableWidth < neededWidth ? neededWidth : 0 );
		}

		update();
		const blockView = blockElement.ownerDocument.defaultView;
		const editorView = parentSelector.ownerDocument.defaultView;
		const resizeObserver = editorView?.ResizeObserver
			? new editorView.ResizeObserver( update )
			: undefined;
		resizeObserver?.observe( parentSelector );
		resizeObserver?.observe( blockElement );
		blockView?.addEventListener( 'resize', update );
		return () => {
			resizeObserver?.disconnect();
			blockView?.removeEventListener( 'resize', update );
		};
	}, [ blockElement, parentSelectorRef, isEnabled ] );

	return overflowWidth;
}

interface RedesignedBlockToolbarProps {
	blockClientId?: string;
	blockClientIds: string[];
	isPlaceholder: boolean;
	isMultiToolbar: boolean;
	isSynced: boolean;
	showParentSelector: boolean;
	isParentSelectorOutside: boolean;
	shouldShowVisualToolbar: boolean;
	isDefaultEditingMode: boolean;
	showBlockVisibilityButton: boolean;
	hideDragHandle?: boolean;
	areSelectedBlocksHiddenOnViewport: boolean;
	canEdit: boolean;
	showShuffleButton: boolean;
	showSwitchSectionStyleButton: boolean;
	isSectionContainer: boolean;
	showSlots: boolean;
	showStyleStateSlot: boolean;
	blockNameRef: RefObject< HTMLDivElement | null >;
	blockNameGestures: HTMLAttributes< HTMLDivElement >;
	onMakeRoomForParent: ( width: number ) => void;
}

/**
 * The contents of the redesigned block toolbar.
 *
 * - The block name, which opens the transform and style presets menu (D).
 * - Full-size block movers (E).
 * - The primary actions slot: block controls, and the Layout menu and
 *   inserter of container blocks (A).
 * - The options menu, with the block tools (A, B, C), and Delete (G).
 * - The parent selector with the full lineage, outside the block (F, I).
 *
 * @see https://github.com/WordPress/gutenberg/issues/85204
 */
export default function RedesignedBlockToolbar( {
	blockClientId,
	blockClientIds,
	isPlaceholder,
	isMultiToolbar,
	isSynced,
	showParentSelector,
	isParentSelectorOutside,
	shouldShowVisualToolbar,
	isDefaultEditingMode,
	showBlockVisibilityButton,
	hideDragHandle,
	areSelectedBlocksHiddenOnViewport,
	canEdit,
	showShuffleButton,
	showSwitchSectionStyleButton,
	isSectionContainer,
	showSlots,
	showStyleStateSlot,
	blockNameRef,
	blockNameGestures,
	onMakeRoomForParent,
}: RedesignedBlockToolbarProps ) {
	const parentSelectorRef = useRef< HTMLDivElement >( null );
	const hasParentSelector = showParentSelector && ! isMultiToolbar;
	const overflowWidth = useParentSelectorOverflow(
		blockClientId,
		parentSelectorRef,
		hasParentSelector && isParentSelectorOutside
	);

	useLayoutEffect( () => {
		onMakeRoomForParent( overflowWidth );
	}, [ overflowWidth, onMakeRoomForParent ] );

	const showBlockTools =
		! isPlaceholder &&
		! areSelectedBlocksHiddenOnViewport &&
		shouldShowVisualToolbar;

	return (
		<BlockOptionsMenuItemsSlot clientIds={ blockClientIds }>
			{ ( items ) => (
				<>
					{ hasParentSelector && (
						<RedesignedBlockParentSelector
							ref={ parentSelectorRef }
						/>
					) }
					{ ( shouldShowVisualToolbar ||
						isMultiToolbar ||
						isPlaceholder ) && (
						<>
							<div
								ref={ blockNameRef }
								className="block-editor-block-toolbar__block-name-wrapper"
								{ ...blockNameGestures }
							>
								<BlockNameMenu
									clientIds={ blockClientIds }
									isSynced={ isSynced }
								/>
							</div>
							{ ! isPlaceholder &&
								isDefaultEditingMode &&
								showBlockVisibilityButton && (
									<ToolbarGroup className="block-editor-block-toolbar__visibility">
										<ViewportVisibilityToolbar
											clientIds={ blockClientIds }
										/>
									</ToolbarGroup>
								) }
							<RedesignedBlockMover
								clientIds={ blockClientIds }
								hideDragHandle={ hideDragHandle }
							/>
						</>
					) }
					{ ! isPlaceholder && ! isMultiToolbar && canEdit && (
						<EditSectionButton clientId={ blockClientIds[ 0 ] } />
					) }
					{ ! areSelectedBlocksHiddenOnViewport &&
						showShuffleButton && (
							<ChangeDesign clientId={ blockClientIds[ 0 ] } />
						) }
					{ ! areSelectedBlocksHiddenOnViewport &&
						showSwitchSectionStyleButton && (
							<SwitchSectionStyle
								clientId={ blockClientIds[ 0 ] }
							/>
						) }
					{ showBlockTools && (
						<>
							{ ! isSectionContainer && showSlots && (
								<>
									<BlockControls.Slot
										group="parent"
										className="block-editor-block-toolbar__slot"
									/>
									<BlockControls.Slot
										group="block"
										className="block-editor-block-toolbar__slot"
									/>
									<BlockControls.Slot className="block-editor-block-toolbar__slot" />
								</>
							) }
							{ ! isSectionContainer && showStyleStateSlot && (
								<BlockControls.Slot
									group="style-state"
									className="block-editor-block-toolbar__slot"
								/>
							) }
							{ ! isSectionContainer &&
								! isMultiToolbar &&
								blockClientId && (
									<ContainerActions
										clientId={ blockClientId }
										items={ items }
									/>
								) }
							{ showSlots && (
								<>
									<BlockControls.Slot
										group="other"
										className="block-editor-block-toolbar__slot"
									/>
									<__unstableBlockToolbarLastItem.Slot />
								</>
							) }
						</>
					) }
					<BlockEditVisuallyButton clientIds={ blockClientIds } />
					<ToolbarGroup className="block-editor-block-toolbar__options">
						<BlockOptionsMenu
							clientIds={ blockClientIds }
							items={ items }
						/>
						<RemoveBlockButton clientIds={ blockClientIds } />
					</ToolbarGroup>
				</>
			) }
		</BlockOptionsMenuItemsSlot>
	);
}
