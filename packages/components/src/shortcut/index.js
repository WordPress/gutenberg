/**
 * External dependencies
 */
import classnames from 'classnames';
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

	const classes = classnames( 'components__shortcut', className );

	return (
		<span className={ classes } aria-label={ ariaLabel }>
			{ displayText }
		</span>
	);
}

export default Shortcut;
