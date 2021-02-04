/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __experimentalLibrary as Library } from '@wordpress/block-editor';
import { close } from '@wordpress/icons';
import {
	useViewportMatch,
	__experimentalUseDialog as useDialog,
} from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

export default function InserterSidebar() {
	const { setIsInserterOpened } = useDispatch( editSiteStore );

	const isMobile = useViewportMatch( 'medium', '<' );
	const [ inserterDialogRef, inserterDialogProps ] = useDialog( {
		onClose: () => setIsInserterOpened( false ),
	} );

	return (
		<div
			ref={ inserterDialogRef }
			{ ...inserterDialogProps }
			className="edit-site-editor__inserter-panel"
		>
			<div className="edit-site-editor__inserter-panel-header">
				<Button
					icon={ close }
					onClick={ () => setIsInserterOpened( false ) }
				/>
			</div>
			<div className="edit-site-editor__inserter-panel-content">
				<Library
					showInserterHelpPanel
					onSelect={ () => {
						if ( isMobile ) {
							setIsInserterOpened( false );
						}
					} }
				/>
			</div>
		</div>
	);
}
