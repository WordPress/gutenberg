/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

export default function ChildBlocks( { rootClientId, children } ) {
	const { rootBlockTitle, rootBlockIcon } = useSelect( ( select ) => {
		const { getBlockType } = select( 'core/blocks' );
		const { getBlockName } = select( 'core/block-editor' );
		const rootBlockName = getBlockName( rootClientId );
		const rootBlockType = getBlockType( rootBlockName );
		return {
			rootBlockTitle: rootBlockType && rootBlockType.title,
			rootBlockIcon: rootBlockType && rootBlockType.icon,
		};
	} );

	return (
		<div className="block-editor-inserter__child-blocks">
			{ ( rootBlockIcon || rootBlockTitle ) && (
				<div className="block-editor-inserter__parent-block-header">
					<BlockIcon icon={ rootBlockIcon } showColors />
					{ rootBlockTitle && <h2>{ rootBlockTitle }</h2> }
				</div>
			) }
			{ children }
		</div>
	);
}
