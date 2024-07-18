/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { plus } from '@wordpress/icons';
import { _x } from '@wordpress/i18n';

function ZoomOutModeInserterButton( { isVisible, onClick } ) {
	const [
		zoomOutModeInserterButtonHovered,
		setZoomOutModeInserterButtonHovered,
	] = useState( false );

	return (
		<Button
			variant="primary"
			icon={ plus }
			size="compact"
			className={ clsx(
				'block-editor-button-pattern-inserter__button',
				'block-editor-block-tools__zoom-out-mode-inserter-button',
				{
					'is-visible': isVisible || zoomOutModeInserterButtonHovered,
				}
			) }
			onClick={ onClick }
			onMouseOver={ () => {
				setZoomOutModeInserterButtonHovered( true );
			} }
			onMouseOut={ () => {
				setZoomOutModeInserterButtonHovered( false );
			} }
			label={ _x(
				'Add pattern',
				'Generic label for pattern inserter button'
			) }
		/>
	);
}

export default ZoomOutModeInserterButton;
