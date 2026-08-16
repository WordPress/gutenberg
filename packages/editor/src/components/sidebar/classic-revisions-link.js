import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import PluginPostRevisionInfo from '../plugin-post-revision-info';

/**
 * Isolated so it can be deleted when the classic revisions screen is removed.
 *
 * @return {JSX.Element} Fill that links to revision.php for the selected revision.
 */
export default function ClassicRevisionsLink() {
	return (
		<PluginPostRevisionInfo>
			{ ( { context } ) => {
				if ( ! context?.revisionId ) {
					return null;
				}
				return (
					<ExternalLink
						href={ addQueryArgs( 'revision.php', {
							revision: context.revisionId,
						} ) }
					>
						{ __( 'Open classic revisions screen' ) }
					</ExternalLink>
				);
			} }
		</PluginPostRevisionInfo>
	);
}
