/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { square as zoomOutIcon } from '@wordpress/icons';

const ZoomOutToggle = () => {
	const { isZoomOutMode } = useSelect( ( select ) => ( {
		isZoomOutMode:
			select( blockEditorStore ).__unstableGetEditorMode() === 'zoom-out',
	} ) );

	const { __unstableSetEditorMode } = useDispatch( blockEditorStore );

	const handleZoomOut = () => {
		__unstableSetEditorMode( isZoomOutMode ? 'edit' : 'zoom-out' );
	};

	return (
		<Button
			onClick={ handleZoomOut }
			icon={ zoomOutIcon }
			label={ __( 'Toggle Zoom Out' ) }
			isPressed={ isZoomOutMode }
			size="compact"
		/>
	);
};

export default ZoomOutToggle;
