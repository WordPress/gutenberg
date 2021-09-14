/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { close } from '@wordpress/icons';
import { __experimentalLibrary as Library } from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';
import { useRef } from '@wordpress/element';

function InserterSidebar() {
	const isMobileViewport = useViewportMatch( 'medium', '<' );

	// Todo: make these dynamic.
	const insertionIndex = 0;
	const inserterDialogRef = useRef();
	const inserterDialogProps = {};
	const rootClientId = '0';

	// Todo: implement in store.
	function setIsInserterOpened() {}

	return (
		<div
			ref={ inserterDialogRef }
			{ ...inserterDialogProps }
			className="edit-widgets-layout__inserter-panel"
		>
			<div className="edit-widgets-layout__inserter-panel-header">
				<Button
					icon={ close }
					onClick={ () => setIsInserterOpened( false ) }
				/>
			</div>
			<div className="edit-widgets-layout__inserter-panel-content">
				<Library
					showInserterHelpPanel
					shouldFocusBlock={ isMobileViewport }
					rootClientId={ rootClientId }
					__experimentalInsertionIndex={ insertionIndex }
				/>
			</div>
		</div>
	);
}

export default InserterSidebar;
