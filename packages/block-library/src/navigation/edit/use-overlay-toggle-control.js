/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { close } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export const OverlayToggleContext = createContext( null );

export function useOverlayToggle() {
	return useContext( OverlayToggleContext );
}

// Register filter to add overlay toggle control to all blocks except template-part blocks
addFilter(
	'editor.BlockEdit',
	'core/navigation/overlay-toggle-control',
	( BlockEdit ) => ( props ) => {
		const overlayToggle = useOverlayToggle();
		const { name } = props;
		const { selectBlock } = useDispatch( blockEditorStore );

		// Don't show the control on template-part blocks
		const isTemplatePart = name === 'core/template-part';

		// Handle close with navigation block selection
		const handleClose = () => {
			if ( overlayToggle ) {
				const { onClose, navigationClientId } = overlayToggle;
				if ( navigationClientId ) {
					selectBlock( navigationClientId );
				}
				if ( onClose ) {
					onClose();
				}
			}
		};

		return (
			<>
				{ overlayToggle && ! isTemplatePart && (
					<BlockControls group="default">
						<ToolbarGroup>
							<ToolbarButton
								icon={ close }
								onClick={ handleClose }
								label={ __( 'Close overlay' ) }
							>
								{ __( 'Close Overlay' ) }
							</ToolbarButton>
						</ToolbarGroup>
					</BlockControls>
				) }
				<BlockEdit { ...props } />
			</>
		);
	}
);
