import { useDispatch } from '@wordpress/data';
import { store as commandsStore } from '@wordpress/commands';
import { __ } from '@wordpress/i18n';
import { search } from '@wordpress/icons';
import {
	displayShortcut,
	isAppleOS,
	shortcutAriaLabel,
} from '@wordpress/keycodes';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components
	IconButton,
} from '@wordpress/ui';

/**
 * Opens the command palette, from the site shell's bar.
 *
 * @return The search button.
 */
export default function ShellSearch() {
	const { open: openCommandPalette } = useDispatch( commandsStore );

	return (
		<IconButton
			variant="minimal"
			tone="neutral"
			icon={ search }
			label={ __( 'Search' ) }
			shortcut={ {
				displayShortcut: displayShortcut.primary( 'k' ),
				ariaKeyShortcut: isAppleOS() ? 'Meta+K' : 'Control+K',
				label: shortcutAriaLabel.primary( 'k' ),
			} }
			onClick={ () => openCommandPalette() }
		/>
	);
}
