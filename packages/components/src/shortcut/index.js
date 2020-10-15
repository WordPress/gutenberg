/**
 * External dependencies
 */
import { isString } from 'lodash';

/** @typedef {string | { display: string, ariaLabel: string }} Shortcut */
/**
 * @typedef Props
 * @property {Shortcut} shortcut Shortcut configuration
 * @property {string} [className] Classname
 */

/**
 * @param {Props} props Props
 * @return {JSX.Element | null} Element
 */
function Shortcut( { shortcut, className } ) {
	if ( ! shortcut ) {
		return null;
	}

	let displayText;
	let ariaLabel;

	if ( isString( shortcut ) ) {
		displayText = shortcut;
	} else {
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
