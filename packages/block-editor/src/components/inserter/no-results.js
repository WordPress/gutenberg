/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

function InserterNoResults() {
	return (
		<div className="block-editor-inserter__no-results">
			<p>{ __( 'No results found.' ) }</p>
		</div>
	);
}

export default InserterNoResults;
