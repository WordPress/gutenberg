import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __, _x, sprintf } from '@wordpress/i18n';
import { useRef } from '@wordpress/element';
import { plus } from '@wordpress/icons';
import { store as blockEditorStore } from '../../store';
import { useParentInserter } from './use-parent-inserter';
import useBlockDisplayInformation from '../use-block-display-information';
import BlockIcon from '../block-icon';
import Inserter from '../inserter';
import { useShowHoveredOrFocusedGestures } from '../block-toolbar/utils';

/**
 * Block parent selector component, displaying the hierarchy of the
 * current block selection as a single icon to "go up" a level.
 *
 * @return {Component} Parent block selector.
 */
export default function BlockParentSelector() {
	const { selectBlock } = useDispatch( blockEditorStore );
	const { parentClientId, nextSiblingClientId, showInserter } =
		useParentInserter();
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
