/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { PanelBody, Button } from '@wordpress/components';
import { sprintf, _n } from '@wordpress/i18n';
import { backup } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';
import { PostTypeSupportCheck } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';

const useRevisionData = () =>
	useSelect( ( select ) => {
		const {
			getCurrentTemplateLastRevisionId,
			getCurrentTemplateRevisionsCount,
		} = select( editSiteStore );
		return {
			lastRevisionId: getCurrentTemplateLastRevisionId(),
			revisionsCount: getCurrentTemplateRevisionsCount(),
		};
	} );

function PostLastRevisionCheck( { children } ) {
	const { lastRevisionId, revisionsCount } = useRevisionData();

	if ( ! lastRevisionId || revisionsCount < 2 ) {
		return null;
	}

	return (
		<PostTypeSupportCheck supportKeys="revisions">
			{ children }
		</PostTypeSupportCheck>
	);
}

const PostLastRevision = () => {
	const { lastRevisionId, revisionsCount } = useRevisionData();

	return (
		<PostLastRevisionCheck>
			<Button
				href={ addQueryArgs( 'revision.php', {
					revision: lastRevisionId,
					gutenberg: true,
				} ) }
				className="edit-site-template-last-revision__title"
				icon={ backup }
			>
				{ sprintf(
					/* translators: %d: number of revisions */
					_n( '%d Revision', '%d Revisions', revisionsCount ),
					revisionsCount
				) }
			</Button>
		</PostLastRevisionCheck>
	);
};

export default function LastRevision() {
	return (
		<PostLastRevisionCheck>
			<PanelBody className="edit-site-template-last-revision__panel">
				<PostLastRevision />
			</PanelBody>
		</PostLastRevisionCheck>
	);
}
