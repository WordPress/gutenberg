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

export default function BlockNavigationSidebar() {
	const { setIsBlockNavigationOpened } = useDispatch( 'core/edit-site' );

	const isMobile = useViewportMatch( 'medium', '<' );
	const [ inserterDialogRef, inserterDialogProps ] = useDialog( {
		onClose: () => setIsBlockNavigationOpened( false ),
	} );

	return (
		<div
			ref={ inserterDialogRef }
			{ ...inserterDialogProps }
			className="edit-site-editor__block-navigation-panel"
		>
			<div className="edit-site-editor__block-navigation-panel-header">
				<Button
					icon={ close }
					onClick={ () => setIsBlockNavigationOpened( false ) }
				/>
			</div>
			<div className="edit-site-editor__block-navigation-panel-content">
				<Library
					showInserterHelpPanel
					onSelect={ () => {
						if ( isMobile ) {
							setIsBlockNavigationOpened( false );
						}
					} }
				/>
			</div>
		</div>
	);
}
