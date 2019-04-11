/**
 * External dependencies
 */
import { isString, isObject } from 'lodash';

function Shortcut( { shortcut, className } ) {
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
