/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

function OpensInNewTabMessage() {
	return (
		<span className="screen-reader-text">
			{
				// We need a space to separate this from previous text.
				' ' +
				/* translators: accessibility text */
				__( '(opens in a new tab)' )
			}
		</span>
	);
}

export default OpensInNewTabMessage;
