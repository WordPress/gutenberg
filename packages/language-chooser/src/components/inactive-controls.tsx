/**
 * WordPress dependencies
 */
import { _x, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { shortcutAriaLabel, displayShortcut } from '@wordpress/keycodes';

interface InactiveControlsProps {
	disabled: boolean;
	onClick: () => void;
}

function InactiveControls( { disabled, onClick }: InactiveControlsProps ) {
	useShortcut( 'language-chooser/add', ( event: Event ) => {
		event.preventDefault();

		if ( disabled ) {
			return;
		}

		onClick();
	} );

	return (
		<div className="inactive-locales-controls">
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
				onClick={ onClick }
			>
				{ _x( 'Add', 'language' ) }
			</Button>
		</div>
	);
}

export default InactiveControls;
