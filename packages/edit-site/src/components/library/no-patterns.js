/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export default function NoPatterns() {
	return (
		<div className="edit-site-library__no-results">
			{ __( 'No patterns found.' ) }
		</div>
	);
}
