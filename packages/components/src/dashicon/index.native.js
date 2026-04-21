/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import * as dashicons from '../mobile/dashicons';

// A predefined SVG icon is rendered instead of Dashicon because it's not supported in the native version.
function Dashicon( { icon, ...extraProps } ) {
	return (
		<Icon icon={ dashicons[ icon ] || dashicons.empty } { ...extraProps } />
	);
}

export default Dashicon;
