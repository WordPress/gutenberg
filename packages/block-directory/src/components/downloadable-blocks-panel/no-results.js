/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, blockDefault, tip } from '@wordpress/icons';

function DownloadableBlocksNoResults() {
	return (
		<div className="block-editor-inserter__no-results">
			<Icon
				className="block-editor-inserter__no-results-icon"
				icon={ blockDefault }
			/>
			<p>{ __( 'No results found.' ) }</p>

			<div className="block-editor-inserter__tips">
				<div className="components-tip">
					<Icon icon={ tip } />
					<h3>{ __( 'Make your own' ) }</h3>
				</div>
				<p>
					It seems that no block exists with the functionality that
					you need.
				</p>
				<p>
					WordPress is open-source software. You could create a block
					with the functionality you want and contribute it to the
					community.
				</p>
				<p>
					<strong>
						<a
							href="https://developer.wordpress.org/block-editor/"
							rel="noreferrer noopener"
							target="_blank"
						>
							{ __( 'Learn more' ) }
						</a>
						.
					</strong>
				</p>
			</div>
		</div>
	);
}

export default DownloadableBlocksNoResults;
