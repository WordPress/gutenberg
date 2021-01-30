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
import { BlockToolbar } from '../';

function BlockContextualToolbar( { focusOnMount, ...props } ) {
	const { blockType, hasParents } = useSelect( ( select ) => {
		const {
			getBlockName,
			getBlockParents,
			getSelectedBlockClientIds,
		} = select( 'core/block-editor' );
		const { getBlockType } = select( blocksStore );
		const selectedBlockClientIds = getSelectedBlockClientIds();
		const selectedBlockClientId = selectedBlockClientIds[ 0 ];
		return {
			blockType:
				selectedBlockClientId &&
				getBlockType( getBlockName( selectedBlockClientId ) ),
			hasParents: getBlockParents( selectedBlockClientId ).length,
		};
	}, [] );
	if ( blockType ) {
		if ( ! hasBlockSupport( blockType, '__experimentalToolbar', true ) ) {
			return null;
		}
	}

	// Shifts the toolbar to make room for the parent block selector.
	const classes = classnames( 'block-editor-block-contextual-toolbar', {
		'with-offset': hasParents,
	} );

	return (
		<div className="block-editor-block-contextual-toolbar-wrapper">
			<NavigableToolbar
				focusOnMount={ focusOnMount }
				className={ classes }
				/* translators: accessibility text for the block toolbar */
				aria-label={ __( 'Block tools' ) }
				{ ...props }
			>
				<BlockToolbar />
			</NavigableToolbar>
		</div>
	);
}

export default BlockContextualToolbar;
