/**
 * Internal dependencies
 */
import type { ShortcutProps } from './types';

/**
 * Shortcut component is used to display keyboard shortcuts, and it can be customized with a custom display and aria label if needed.
 *
 * ```jsx
 * import { Shortcut } from '@wordpress/components';
 *
 * const MyShortcut = () => {
 * 	return (
 * 		<Shortcut shortcut={{ display: 'Ctrl + S', ariaLabel: 'Save' }} />
 * 	);
 * };
 * ```
 */
function Shortcut( props: ShortcutProps ) {
	const { shortcut, className } = props;

	if ( ! shortcut ) {
		return null;
	}

	let displayText;
	let ariaLabel;

	if ( typeof shortcut === 'string' ) {
		displayText = shortcut;
	}

	if ( shortcut !== null && typeof shortcut === 'object' ) {
		displayText = shortcut.display;
		ariaLabel = shortcut.ariaLabel;
	}

	return (
		<span className={ className } aria-label={ ariaLabel }>
			{ displayText }
		</span>
	);
}

export default Shortcut;
