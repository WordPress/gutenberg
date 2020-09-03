/**
 * WordPress dependencies
 */
import { __experimentalBlockNavigationTree as BlockNavigationTree } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import PopoverWrapper from './popover-wrapper';

export default function ListViewPanel( { isOpened, setIsOpened } ) {
	const { rootBlocks, selectedBlockClientId } = useSelect( ( select ) => {
		const selectors = select( 'core/block-editor' );
		return {
			rootBlocks: selectors.__unstableGetBlockTree(),
			selectedBlockClientId: selectors.getSelectedBlockClientId(),
		};
	}, [] );

	const { selectBlock } = useDispatch( 'core/block-editor' );

	if ( ! isOpened ) {
		return null;
	}

	return (
		<PopoverWrapper
			className="edit-post-layout__list-view-panel-popover-wrapper"
			onClose={ () => setIsOpened( false ) }
		>
			<div className="edit-post-layout__list-view-panel">
				<div className="edit-post-layout__list-view-panel-header">
					<Button
						icon={ close }
						onClick={ () => setIsOpened( false ) }
					/>
				</div>
				<div className="edit-post-layout__list-view-panel-content">
					<BlockNavigationTree
						blocks={ rootBlocks }
						selectedBlockClientId={ selectedBlockClientId }
						selectBlock={ selectBlock }
						__experimentalFeatures
						showNestedBlocks
						showAppender
						showBlockMovers
					/>
				</div>
			</div>
		</PopoverWrapper>
	);
}
