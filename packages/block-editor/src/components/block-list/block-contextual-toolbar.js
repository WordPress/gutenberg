/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { hasBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import NavigableToolbar from '../navigable-toolbar';
import { BlockToolbar } from '../';

function BlockContextualToolbar( { focusOnMount, ...props } ) {
	const { blockType, isEditingInToolbar } = useSelect( ( select ) => {
		const {
			getBlockName,
			getSelectedBlockClientIds,
			getIsEditingInToolbar,
		} = select( 'core/block-editor' );
		const { getBlockType } = select( 'core/blocks' );
		const selectedBlockClientIds = getSelectedBlockClientIds();
		const selectedBlockClientId = selectedBlockClientIds[ 0 ];
		return {
			isEditingInToolbar: getIsEditingInToolbar(),
			blockType:
				selectedBlockClientId &&
				getBlockType( getBlockName( selectedBlockClientId ) ),
		};
	}, [] );
	if ( blockType ) {
		if ( ! hasBlockSupport( blockType, '__experimentalToolbar', true ) ) {
			return null;
		}
	}
	return (
		<div className="block-editor-block-contextual-toolbar-wrapper">
			<NavigableToolbar
				focusOnMount={ focusOnMount }
				className={ classnames(
					'block-editor-block-contextual-toolbar',
					{
						'is-editing-in-toolbar': isEditingInToolbar,
					}
				) }
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
