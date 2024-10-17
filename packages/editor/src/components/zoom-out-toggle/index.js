/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { square as zoomOutIcon } from '@wordpress/icons';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

const ZoomOutToggle = () => {
	const { isZoomOut, showIconLabels, mode } = useSelect( ( select ) => ( {
		isZoomOut: unlock( select( blockEditorStore ) ).isZoomOut(),
		showIconLabels: select( preferencesStore ).get(
			'core',
			'showIconLabels'
		),
		mode: unlock( select( editorStore ) ).getEditorMode(),
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

	if ( 'text' === mode ) {
		resetZoomLevel();
		__unstableSetEditorMode( 'edit' );
	}

	return (
		<Button
			onClick={ handleZoomOut }
			icon={ zoomOutIcon }
			label={ __( 'Zoom Out' ) }
			isPressed={ isZoomOut }
			size="compact"
			showTooltip={ ! showIconLabels }
		/>
	);
};

export default ZoomOutToggle;
