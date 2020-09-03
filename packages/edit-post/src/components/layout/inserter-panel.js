/**
 * WordPress dependencies
 */
import { __experimentalLibrary as Library } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import PopoverWrapper from './popover-wrapper';

export default function InserterPanel( {
	isOpened,
	setIsOpened,
	showMostUsedBlocks,
	isMobileViewport,
} ) {
	if ( ! isOpened ) {
		return null;
	}

	return (
		<PopoverWrapper
			className="edit-post-layout__inserter-panel-popover-wrapper"
			onClose={ () => setIsOpened( false ) }
		>
			<div className="edit-post-layout__inserter-panel">
				<div className="edit-post-layout__inserter-panel-header">
					<Button
						icon={ close }
						onClick={ () => setIsOpened( false ) }
					/>
				</div>
				<div className="edit-post-layout__inserter-panel-content">
					<Library
						showMostUsedBlocks={ showMostUsedBlocks }
						showInserterHelpPanel
						onSelect={ () => {
							if ( isMobileViewport ) {
								setIsOpened( false );
							}
						} }
					/>
				</div>
			</div>
		</PopoverWrapper>
	);
}
