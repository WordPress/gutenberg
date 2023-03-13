/**
 * Internal dependencies
 */
import type { ShortcutProps } from './types';

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
