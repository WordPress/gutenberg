/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { hasBlockSupport, store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import NavigableToolbar from '../navigable-toolbar';
import BlockToolbar from '../block-toolbar';
import { store as blockEditorStore } from '../../store';

function BlockContextualToolbar( { focusOnMount, isFixed, ...props } ) {
	const { blockType, hasParents, showParentSelector } = useSelect(
		( select ) => {
			const {
				getBlockName,
				getBlockParents,
				getSelectedBlockClientIds,
				__unstableGetContentLockingParent,
			} = select( blockEditorStore );
			const { getBlockType } = select( blocksStore );
			const selectedBlockClientIds = getSelectedBlockClientIds();
			const selectedBlockClientId = selectedBlockClientIds[ 0 ];
			const parents = getBlockParents( selectedBlockClientId );
			const firstParentClientId = parents[ parents.length - 1 ];
			const parentBlockName = getBlockName( firstParentClientId );
			const parentBlockType = getBlockType( parentBlockName );

			return {
				blockType:
					selectedBlockClientId &&
					getBlockType( getBlockName( selectedBlockClientId ) ),
				hasParents: parents.length,
				showParentSelector:
					parentBlockType &&
					hasBlockSupport(
						parentBlockType,
						'__experimentalParentSelector',
						true
					) &&
					selectedBlockClientIds.length <= 1 &&
					! __unstableGetContentLockingParent(
						selectedBlockClientId
					),
			};
		},
		[]
	);

	if ( blockType ) {
		if ( ! hasBlockSupport( blockType, '__experimentalToolbar', true ) ) {
			return null;
		}
	}

	// Shifts the toolbar to make room for the parent block selector.
	const classes = classnames( 'block-editor-block-contextual-toolbar', {
		'has-parent': hasParents && showParentSelector,
		'is-fixed': isFixed,
	} );

	return (
		<NavigableToolbar
			focusOnMount={ focusOnMount }
			className={ classes }
			/* translators: accessibility text for the block toolbar */
			aria-label={ __( 'Block tools' ) }
			{ ...props }
		>
			<BlockToolbar hideDragHandle={ isFixed } />
		</NavigableToolbar>
	);
}

export default BlockContextualToolbar;
