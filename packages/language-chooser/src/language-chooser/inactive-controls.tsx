/**
 * WordPress dependencies
 */
import { _x, sprintf } from '@wordpress/i18n';
import { shortcutAriaLabel, displayShortcut } from '@wordpress/keycodes';
import { Button } from '@wordpress/components';

interface InactiveControlsProps {
	disabled: boolean;
	onAdd: () => void;
}

function InactiveControls( { disabled, onAdd }: InactiveControlsProps ) {
	return (
		<div className="language-chooser__inactive-locales-controls">
			<Button
				variant="secondary"
				showTooltip
				aria-keyshortcuts="Alt+A"
				aria-label={ sprintf(
					/* translators: accessibility text. %s: keyboard shortcut. */
					_x( 'Add to list (%s)', 'language' ),
					shortcutAriaLabel.alt( 'A' )
				) }
				label={ displayShortcut.alt( 'A' ) }
				disabled={ disabled }
				accessibleWhenDisabled
				onClick={ onAdd }
				__next40pxDefaultSize
			>
				{ _x( 'Add', 'language' ) }
			</Button>
		</div>
	);
}

export default InactiveControls;
