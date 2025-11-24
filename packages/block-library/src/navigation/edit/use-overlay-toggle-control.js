/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { close } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export const OverlayToggleContext = createContext( null );

export function useOverlayToggle() {
	return useContext( OverlayToggleContext );
}

// Register filter to add overlay toggle control to all blocks
addFilter(
	'editor.BlockEdit',
	'core/navigation/overlay-toggle-control',
	( BlockEdit ) => ( props ) => {
		const onClose = useOverlayToggle();

		return (
			<>
				{ onClose && (
					<BlockControls group="default">
						<ToolbarGroup>
							<ToolbarButton
								icon={ close }
								onClick={ onClose }
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
