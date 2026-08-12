import { ToolbarButton } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useRef } from '@wordpress/element';
import { hasBlockSupport } from '@wordpress/blocks';
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
				getBlockIndex,
				getBlockOrder,
			} = unlock( select( blockEditorStore ) );
			// Not getSelectedBlockClientId: a text selection crossing into a
			// nested block resolves to the ancestor alone, but its selection
			// start and end differ.
			const [ selectedBlockClientId ] = getSelectedBlockClientIds();
			const parentSection = getParentSectionBlock(
				selectedBlockClientId
			);
			const parents = getBlockParents( selectedBlockClientId );
			const _parentClientId =
				parentSection ?? parents[ parents.length - 1 ];
			// The child of the parent on the selection's path: the selected
			// block itself unless the parent is a section further up.
			const childClientId =
				parents[ parents.indexOf( _parentClientId ) + 1 ] ??
				selectedBlockClientId;
			return {
				parentClientId: _parentClientId,
				nextSiblingClientId:
					getBlockOrder( _parentClientId )[
						getBlockIndex( childClientId ) + 1
					],
				// A block that splits (paragraph, heading, list item,
				// button) grows the container by typing: Enter appends a
				// sibling. Only blocks that cannot split need an explicit
				// affordance to add one.
				showInserter:
					!! _parentClientId &&
					! hasBlockSupport(
						getBlockName( selectedBlockClientId ),
						'splitting',
						false
					),
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

	return (
		<div
			className="block-editor-block-parent-selector"
			key={ parentClientId }
			ref={ nodeRef }
			{ ...showHoveredOrFocusedGestures }
		>
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
			{ showInserter && (
				<Inserter
					position="bottom center"
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
											/* translators: %s: title of the block to be added. */
											__( 'Add %s' ),
											blockTitle
									  )
									: __( 'Add block' )
							}
							showTooltip
							icon={ plus }
						/>
					) }
				/>
			) }
		</div>
	);
}
