/** @typedef {string | { display: string, ariaLabel: string }} Shortcut */
/**
 * @typedef Props
 * @property {Shortcut} shortcut    Shortcut configuration
 * @property {string}   [className] Classname
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
