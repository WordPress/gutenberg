/**
 * WordPress dependencies
 */
import { Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';

function Warning( { children } ) {
	return (
		<div className="editor-warning">
			<Dashicon icon="warning" />
			{ children }
		</div>
	);
}

export default Warning;
