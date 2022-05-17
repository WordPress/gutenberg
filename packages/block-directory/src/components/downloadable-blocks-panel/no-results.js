/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, blockDefault } from '@wordpress/icons';

function DownloadableBlocksNoResults() {
	return (
		<div className="block-editor-inserter__no-results">
			<Icon
				className="block-editor-inserter__no-results-icon"
				icon={ blockDefault }
			/>
			<p>{ __( 'No results found.' ) }</p>
			<p>{ __( 'Interested in creating your own block?' ) }</p>
			<p>
				<a
					href="https://developer.wordpress.org/block-editor/"
					rel="noreferrer noopener"
					target="_blank"
				>
					{ __( 'Get started here' ) }
				</a>
				.
			</p>
		</div>
	);
}

export default DownloadableBlocksNoResults;
