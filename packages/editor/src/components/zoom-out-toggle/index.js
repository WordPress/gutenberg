/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

// Todo - make a proper icon.
import { SVG, Path } from '@wordpress/primitives';

const ZoomOutIcon = (
	<SVG
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<Path
			fill="none"
			d="M5.75 12.75V18.25H11.25M12.75 5.75H18.25V11.25"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="square"
		/>
	</SVG>
);

const ZoomOutToggle = () => {
	const { __unstableSetEditorMode } = useDispatch( blockEditorStore );
	const { isZoomOutMode } = useSelect( ( select ) => ( {
		isZoomOutMode:
			select( blockEditorStore ).__unstableGetEditorMode() === 'zoom-out',
	} ) );

	const handleZoomOut = () => {
		__unstableSetEditorMode( isZoomOutMode ? 'edit' : 'zoom-out' );
	};

	return (
		<Button
			onClick={ handleZoomOut }
			icon={ ZoomOutIcon }
			label={ __( 'Toggle Zoom Out' ) }
			isPressed={ isZoomOutMode }
			size="compact"
		/>
	);
};

export default ZoomOutToggle;
