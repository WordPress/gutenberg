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
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import NavigableToolbar from '../navigable-toolbar';
import BlockToolbar from '../block-toolbar';
import { store as blockEditorStore } from '../../store';

function BlockContextualToolbar( { focusOnMount, isFixed, ...props } ) {
	const {
		blockType,
		hasParents,
		showParentSelector,
		reusableBlockHasEdits,
	} = useSelect( ( select ) => {
		const {
			getBlockName,
			getBlockParents,
			getSelectedBlockClientIds,
			getBlockAttributes,
		} = select( blockEditorStore );
		const { getBlockType } = select( blocksStore );
		const selectedBlockClientIds = getSelectedBlockClientIds();
		const selectedBlockClientId = selectedBlockClientIds[ 0 ];
		const parents = getBlockParents( selectedBlockClientId );
		const firstParentClientId = parents[ parents.length - 1 ];
		const parentBlockName = getBlockName( firstParentClientId );
		const parentBlockType = getBlockType( parentBlockName );
		const parentBlockRef = getBlockAttributes( firstParentClientId )?.ref;
		const blockHasEdits = select( coreStore ).hasEditsForEntityRecord(
			'postType',
			'wp_block',
			parentBlockRef
		);
		const _reusableBlockHasEdits =
			blockHasEdits && parentBlockName === 'core/block';

		return {
			blockType:
				selectedBlockClientId &&
				getBlockType( getBlockName( selectedBlockClientId ) ),
			hasParents: parents.length,
			showParentSelector: hasBlockSupport(
				parentBlockType,
				'__experimentalParentSelector',
				true
			),
			reusableBlockHasEdits: _reusableBlockHasEdits,
		};
	}, [] );
	if ( blockType ) {
		if ( ! hasBlockSupport( blockType, '__experimentalToolbar', true ) ) {
			return null;
		}
	}

	// Shifts the toolbar to make room for the parent block selector.
	const classes = classnames( 'block-editor-block-contextual-toolbar', {
		'has-parent': hasParents && showParentSelector,
		'is-fixed': isFixed,
		'block-has-changes': reusableBlockHasEdits,
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
