import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, _x, sprintf } from '@wordpress/i18n';
import { useRef } from '@wordpress/element';
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
import { plus } from '@wordpress/icons';
import useBlockDisplayInformation from '../use-block-display-information';
import BlockIcon from '../block-icon';
import Inserter from '../inserter';
import { useShowHoveredOrFocusedGestures } from '../block-toolbar/utils';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Block parent selector component, displaying the hierarchy of the
 * current block selection as a single icon to "go up" a level.
 *
 * @return {Component} Parent block selector.
 */
export default function BlockParentSelector() {
	const { selectBlock } = useDispatch( blockEditorStore );
	const { parentClientId, nextSiblingClientId, showInserter } = useSelect(
		( select ) => {
			const {
				getBlockParents,
				getSelectedBlockClientIds,
				getParentSectionBlock,
				getBlockName,
				getNextBlockClientId,
			} = unlock( select( blockEditorStore ) );
			// Not getSelectedBlockClientId: a text selection crossing into a
			// nested block resolves to the ancestor alone, but its selection
			// start and end differ.
			const [ selectedBlockClientId ] = getSelectedBlockClientIds();
			const parentSection = getParentSectionBlock(
				selectedBlockClientId
			);
			const parents = getBlockParents( selectedBlockClientId );
			const immediateParentClientId = parents[ parents.length - 1 ];
			const _parentClientId = parentSection ?? immediateParentClientId;
			const parentBlockType = getBlockType(
				getBlockName( _parentClientId )
			);
			// A wrapper that merges with the text flow (list, quote) grows
			// by typing: Enter continues it, and users know that. Any
			// other parent gets a plus button to add a child; the Inserter
			// hides itself when nothing is insertable.
			const isTextFlowWrapper =
				parentBlockType?.merge ||
				hasBlockSupport( parentBlockType, '__experimentalOnMerge' );
			return {
				parentClientId: _parentClientId,
				nextSiblingClientId: getNextBlockClientId(
					selectedBlockClientId
				),
				// When the shown parent is a section further up the tree
				// rather than the direct parent, its content is locked and
				// nothing can be inserted, so no button.
				showInserter:
					!! _parentClientId &&
					_parentClientId === immediateParentClientId &&
					! isTextFlowWrapper,
			};
		},
		[]
	);
	const blockInformation = useBlockDisplayInformation( parentClientId );

	// Allows highlighting the parent block outline when focusing or hovering
	// the parent block selector within the child.
	const nodeRef = useRef();
	const showHoveredOrFocusedGestures = useShowHoveredOrFocusedGestures( {
		ref: nodeRef,
		highlightParent: true,
	} );

	const parentButton = (
		<ToolbarButton
			className="block-editor-block-parent-selector__button"
			onClick={ () => selectBlock( parentClientId ) }
			label={ sprintf(
				/* translators: %s: Name of the block's parent. */
				__( 'Select parent block: %s' ),
				blockInformation?.title
			) }
			showTooltip
			icon={ <BlockIcon icon={ blockInformation?.icon } /> }
		/>
	);

	return (
		<div
			className="block-editor-block-parent-selector"
			key={ parentClientId }
			ref={ nodeRef }
			{ ...showHoveredOrFocusedGestures }
		>
			{ ! showInserter && parentButton }
			{ showInserter && (
				// A real toolbar group, so the buttons get the standard
				// toolbar sizing, and the group overlaps the container
				// border the way toolbar groups overlap the toolbar box.
				<ToolbarGroup>
					{ parentButton }
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
								className="block-editor-block-parent-selector__inserter"
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
								icon={ plus }
							/>
						) }
					/>
				</ToolbarGroup>
			) }
		</div>
	);
}
