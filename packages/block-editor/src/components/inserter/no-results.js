/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, blockDefault } from '@wordpress/icons';

function InserterNoResults( { filterValue } ) {
	return (
		<div className="block-editor-inserter__no-results">
			<Icon
				className="block-editor-inserter__no-results-icon"
				icon={ blockDefault }
			/>
			<p>
				{ createInterpolateElement(
					sprintf(
						/* translators: %s: search term. */
						__( 'Sorry no results found on <strong>%s</strong>.' ),
						filterValue
					),
					{ strong: <strong /> }
				) }
			</p>
		</div>
	);
}

export default InserterNoResults;
