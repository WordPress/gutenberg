/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, blockDefault } from '@wordpress/icons';
import { Tip, ExternalLink } from '@wordpress/components';

function DownloadableBlocksNoResults() {
	return (
		<>
			<div className="block-editor-inserter__no-results">
				<Icon
					className="block-editor-inserter__no-results-icon"
					icon={ blockDefault }
				/>
				<p>{ __( 'No results found.' ) }</p>
			</div>
			<div className="block-editor-inserter__tips">
				<Tip>
					<div>
						<p>
							{ __( 'Interested in creating your own block?' ) }
						</p>
						<ExternalLink href="https://developer.wordpress.org/block-editor/">
							{ __( 'Get started here' ) }.
						</ExternalLink>
					</div>
				</Tip>
			</div>
		</>
	);
}

export default DownloadableBlocksNoResults;
