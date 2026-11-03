import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	useCanConvertToCanvas,
	useConvertToCanvas,
} from './use-convert-to-canvas';

interface ConvertToCanvasMenuItemProps {
	/** Client ID of the block. */
	clientId: string;
	/** Closes the menu. */
	onClose?: () => void;
}

/**
 * A block settings menu item that converts a container to a canvas.
 */
export function ConvertToCanvasMenuItem( {
	clientId,
	onClose,
}: ConvertToCanvasMenuItemProps ) {
	const canConvert = useCanConvertToCanvas( clientId );
	const convertToCanvas = useConvertToCanvas();
	if ( ! canConvert ) {
		return null;
	}
	return (
		<MenuItem
			onClick={ () => {
				convertToCanvas( clientId );
				onClose?.();
			} }
		>
			{ __( 'Convert to canvas' ) }
		</MenuItem>
	);
}
