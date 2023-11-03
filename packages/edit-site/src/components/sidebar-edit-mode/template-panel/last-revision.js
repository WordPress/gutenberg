/**
 * WordPress dependencies
 */
import { Button, PanelRow } from '@wordpress/components';
import { sprintf, _n, __ } from '@wordpress/i18n';
import { backup } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';
import { PostTypeSupportCheck } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import useEditedEntityRecord from '../../use-edited-entity-record';

const useRevisionData = ( postType, postId ) => {
	const { record: currentTemplate } = useEditedEntityRecord(
		postType,
		postId
	);

	const lastRevisionId =
		currentTemplate?._links?.[ 'predecessor-version' ]?.[ 0 ]?.id ?? null;

	const revisionsCount =
		currentTemplate?._links?.[ 'version-history' ]?.[ 0 ]?.count ?? 0;

	return {
		currentTemplate,
		lastRevisionId,
		revisionsCount,
	};
};

function PostLastRevisionCheck( { postType, postId, children } ) {
	const { lastRevisionId, revisionsCount } = useRevisionData(
		postType,
		postId
	);

	if ( ! process.env.IS_GUTENBERG_PLUGIN ) {
		return null;
	}

	if ( ! lastRevisionId || revisionsCount < 2 ) {
		return null;
	}

	return (
		<PostTypeSupportCheck supportKeys="revisions">
			{ children }
		</PostTypeSupportCheck>
	);
}

const PostLastRevision = ( { postType, postId } ) => {
	const { lastRevisionId, revisionsCount } = useRevisionData(
		postType,
		postId
	);

	return (
		<PostLastRevisionCheck postType={ postType } postId={ postId }>
			<PanelRow
				header={ __( 'Editing history' ) }
				className="edit-site-template-revisions"
			>
				<Button
					href={ addQueryArgs( 'revision.php', {
						revision: lastRevisionId,
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
			</PanelRow>
		</PostLastRevisionCheck>
	);
};

export default function LastRevision( props ) {
	return (
		<PostLastRevisionCheck { ...props }>
			<PostLastRevision { ...props } />
		</PostLastRevisionCheck>
	);
}
