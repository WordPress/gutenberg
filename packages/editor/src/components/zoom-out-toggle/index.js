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

const ZoomOutToggle = ( { disabled } ) => {
	const { isZoomOut, showIconLabels } = useSelect( ( select ) => ( {
		isZoomOut: unlock( select( blockEditorStore ) ).isZoomOut(),
		showIconLabels: select( preferencesStore ).get(
			'core',
			'showIconLabels'
		),
	} ) );

	const { resetZoomLevel, setZoomLevel } = unlock(
		useDispatch( blockEditorStore )
	);

	const handleZoomOut = () => {
		if ( isZoomOut ) {
			resetZoomLevel();
		} else {
			setZoomLevel( 'auto-scaled' );
		}
	};

	return (
		<Button
			accessibleWhenDisabled
			disabled={ disabled }
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
