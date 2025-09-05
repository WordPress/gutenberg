/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useBlockDisplayInformation from '../use-block-display-information';
import BlockIcon from '../block-icon';
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
	const { parentClientId } = useSelect( ( select ) => {
		const {
			getBlockParents,
			getSelectedBlockClientId,
			getParentSectionBlock,
		} = unlock( select( blockEditorStore ) );
		const selectedBlockClientId = getSelectedBlockClientId();
		const parentSection = getParentSectionBlock( selectedBlockClientId );
		const parents = getBlockParents( selectedBlockClientId );
		const _parentClientId = parentSection ?? parents[ parents.length - 1 ];
		return {
			parentClientId: _parentClientId,
		};
	}, [] );
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
		</div>
	);
}
