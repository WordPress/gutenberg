import clsx from 'clsx';
import { Button } from '@wordpress/components';
import { plus } from '@wordpress/icons';
import { _x } from '@wordpress/i18n';
import type { ZoomOutModeInserterButtonProps } from './types';

function ZoomOutModeInserterButton( {
	onClick,
}: ZoomOutModeInserterButtonProps ) {
	return (
		<Button
			variant="primary"
			icon={ plus }
			size="compact"
			className={ clsx(
				'block-editor-button-pattern-inserter__button',
				'block-editor-block-tools__zoom-out-mode-inserter-button'
			) }
			onClick={ onClick }
			label={ _x(
				'Add pattern',
				'Generic label for pattern inserter button'
			) }
		/>
	);
}

export default ZoomOutModeInserterButton;
