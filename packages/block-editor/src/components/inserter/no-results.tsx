import type { ReactNode } from 'react';
import { __ } from '@wordpress/i18n';

function InserterNoResults( {
	children = __( 'No results found.' ),
}: {
	children?: ReactNode;
} ) {
	return (
		<div className="block-editor-inserter__no-results">
			<p>{ children }</p>
		</div>
	);
}

export default InserterNoResults;
