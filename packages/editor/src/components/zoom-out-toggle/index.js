/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { square as zoomOutIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const ZoomOutToggle = () => {
	const { isZoomOut } = useSelect( ( select ) => ( {
		isZoomOut: unlock( select( blockEditorStore ) ).isZoomOut(),
	} ) );

	const { resetZoomLevel, setZoomLevel, __unstableSetEditorMode } = unlock(
		useDispatch( blockEditorStore )
	);

	const handleZoomOut = () => {
		if ( isZoomOut ) {
			resetZoomLevel();
		} else {
			setZoomLevel( 50 );
		}
		__unstableSetEditorMode( isZoomOut ? 'edit' : 'zoom-out' );
	};

	return (
		<Button
			onClick={ handleZoomOut }
			icon={ zoomOutIcon }
			label={ __( 'Toggle Zoom Out' ) }
			isPressed={ isZoomOut }
			size="compact"
		/>
	);
};

export default ZoomOutToggle;
