/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { ToolbarButton } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

/**
 * Block parent selector component, displaying the hierarchy of the
 * current block selection as a single icon to "go up" a level.
 *
 * @return {WPComponent} Parent block selector.
 */
export default function BlockParentSelector() {
	const { selectBlock } = useDispatch( 'core/block-editor' );
	const { parentBlockType, firstParentClientId } = useSelect( ( select ) => {
		const {
			getBlockName,
			getBlockParents,
			getSelectedBlockClientId,
		} = select( 'core/block-editor' );
		const selectedBlockClientId = getSelectedBlockClientId();
		const parents = getBlockParents( selectedBlockClientId );
		const _firstParentClientId = parents[ parents.length - 1 ];
		const parentBlockName = getBlockName( _firstParentClientId );
		return {
			parentBlockType: getBlockType( parentBlockName ),
			firstParentClientId: _firstParentClientId,
		};
	}, [] );

	if ( firstParentClientId !== undefined ) {
		return (
			<div
				className="block-editor-block-parent-selector"
				key={ firstParentClientId }
			>
				<ToolbarButton
					className="block-editor-block-parent-selector__button"
					onClick={ () => selectBlock( firstParentClientId ) }
					label={ sprintf(
						/* translators: %s: Name of the block's parent. */
						__( 'Select parent (%s)' ),
						parentBlockType.title
					) }
					showTooltip
					icon={ <BlockIcon icon={ parentBlockType.icon } /> }
				/>
			</div>
		);
	}

	return null;
}
