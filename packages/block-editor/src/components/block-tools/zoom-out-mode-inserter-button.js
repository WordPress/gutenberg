/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { plus } from '@wordpress/icons';
import { _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

function ZoomOutModeInserterButton( { onClick } ) {
	const selectedTab = useSelect( ( select ) => {
		return select( blockEditorStore ).getSelectedTab();
	}, [] );

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
			label={ sprintf(
				/* translators: %s: tab name (e.g. "pattern" or "block") */
				_x( 'Add %s', 'Label for zoom out mode inserter button.' ),
				selectedTab
			) }
		/>
	);
}

export default ZoomOutModeInserterButton;
