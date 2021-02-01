/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __experimentalBlockNavigationTree as BlockNavigationTree } from '@wordpress/block-editor';
import { close } from '@wordpress/icons';

export default function BlockNavigationSidebar() {
	const { rootBlocks, selectedBlockClientId } = useSelect( ( select ) => {
		const { getSelectedBlockClientId, __unstableGetBlockTree } = select(
			'core/block-editor'
		);
		return {
			rootBlocks: __unstableGetBlockTree(),
			selectedBlockClientId: getSelectedBlockClientId(),
		};
	} );
	const { selectBlock } = useDispatch( 'core/block-editor' );
	const { setIsBlockNavigationOpened } = useDispatch( 'core/edit-site' );

	return (
		<div className="edit-site-editor__block-navigation-panel">
			<div className="edit-site-editor__block-navigation-panel-header">
				<Button
					icon={ close }
					onClick={ () => setIsBlockNavigationOpened( false ) }
				/>
			</div>
			<div className="edit-site-editor__block-navigation-panel-content">
				<BlockNavigationTree
					blocks={ rootBlocks }
					selectBlock={ selectBlock }
					selectedBlockClientId={ selectedBlockClientId }
					showNestedBlocks
				/>
			</div>
		</div>
	);
}
