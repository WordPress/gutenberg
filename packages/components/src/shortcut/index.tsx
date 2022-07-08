/**
 * External dependencies
 */
import { isString, isObject } from 'lodash';

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

	if ( isString( shortcut ) ) {
		displayText = shortcut;
	}

	if ( isObject( shortcut ) ) {
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
