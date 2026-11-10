import { __ } from '@wordpress/i18n';
import { tip } from '@wordpress/icons';
import { Notice } from '@wordpress/ui';

function DownloadableBlocksNoResults() {
	return (
		<>
			<div className="block-editor-inserter__no-results">
				<p>{ __( 'No results found.' ) }</p>
			</div>
			<div className="block-editor-inserter__tips">
				<Notice.Root intent="info" icon={ tip }>
					<Notice.Description>
						{ __( 'Interested in creating your own block?' ) }
					</Notice.Description>
					<Notice.Actions>
						<Notice.ActionLink
							href="https://developer.wordpress.org/block-editor/"
							openInNewTab
						>
							{ __( 'Get started here' ) }.
						</Notice.ActionLink>
					</Notice.Actions>
				</Notice.Root>
			</div>
		</>
	);
}

export default DownloadableBlocksNoResults;
