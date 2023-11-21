/**
 * WordPress dependencies
 */
import { getBlockType, store as blocksStore } from '@wordpress/blocks';
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

/**
 * Block parent selector component, displaying the hierarchy of the
 * current block selection as a single icon to "go up" a level.
 *
 * @return {Component} Parent block selector.
 */
export default function BlockParentSelector() {
	const { selectBlock } = useDispatch( blockEditorStore );
	const { firstParentClientId, isVisible } = useSelect( ( select ) => {
		const {
			getBlockName,
			getBlockParents,
			getSelectedBlockClientId,
			getBlockEditingMode,
		} = select( blockEditorStore );
		const { hasBlockSupport } = select( blocksStore );
		const selectedBlockClientId = getSelectedBlockClientId();
		const parents = getBlockParents( selectedBlockClientId );
		const _firstParentClientId = parents[ parents.length - 1 ];
		const parentBlockName = getBlockName( _firstParentClientId );
		const _parentBlockType = getBlockType( parentBlockName );
		return {
			firstParentClientId: _firstParentClientId,
			isVisible:
				_firstParentClientId &&
				getBlockEditingMode( _firstParentClientId ) === 'default' &&
				hasBlockSupport(
					_parentBlockType,
					'__experimentalParentSelector',
					true
				),
		};
	}, [] );
	const blockInformation = useBlockDisplayInformation( firstParentClientId );

	// Allows highlighting the parent block outline when focusing or hovering
	// the parent block selector within the child.
	const nodeRef = useRef();
	const showHoveredOrFocusedGestures = useShowHoveredOrFocusedGestures( {
		ref: nodeRef,
		highlightParent: true,
	} );

	if ( ! isVisible ) {
		return null;
	}

	return (
		<div
			className="block-editor-block-parent-selector"
			key={ firstParentClientId }
			ref={ nodeRef }
			{ ...showHoveredOrFocusedGestures }
		>
			<ToolbarButton
				className="block-editor-block-parent-selector__button"
				onClick={ () => selectBlock( firstParentClientId ) }
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
