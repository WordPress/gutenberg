/**
 * WordPress dependencies
 */
import { useSelect, withSelect } from '@wordpress/data';
import { Icon, PanelBody, Button } from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { sprintf, _n } from '@wordpress/i18n';
import { backup } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import TemplateActions from './template-actions';
import TemplateAreas from './template-areas';
import PostTypeSupportCheck from '../../../../../editor/src/components/post-type-support-check';

/*
 * TODO Refactor all of these components copied from the editor.
 */

export function _PostLastRevisionCheck( {
	lastRevisionId,
	revisionsCount,
	children,
} ) {
	if ( ! lastRevisionId || revisionsCount < 2 ) {
		return null;
	}

	return (
		<PostTypeSupportCheck supportKeys="revisions">
			{ children }
		</PostTypeSupportCheck>
	);
}

const PostLastRevisionCheck = withSelect( ( select ) => {
	const {
		getCurrentTemplateLastRevisionId,
		getCurrentTemplateRevisionsCount,
	} = select( editSiteStore );
	return {
		lastRevisionId: getCurrentTemplateLastRevisionId(),
		revisionsCount: getCurrentTemplateRevisionsCount(),
	};
} )( _PostLastRevisionCheck );

const _PostLastRevision = ( { lastRevisionId, revisionsCount } ) => {
	return (
		<PostLastRevisionCheck>
			<Button
				href={ addQueryArgs( 'revision.php', {
					revision: lastRevisionId,
					gutenberg: true,
				} ) }
				className="editor-post-last-revision__title"
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

const PostLastRevision = withSelect( ( select ) => {
	const {
		getCurrentTemplateLastRevisionId,
		getCurrentTemplateRevisionsCount,
	} = select( editSiteStore );
	return {
		lastRevisionId: getCurrentTemplateLastRevisionId(),
		revisionsCount: getCurrentTemplateRevisionsCount(),
	};
} )( _PostLastRevision );

function LastRevision() {
	return (
		<PostLastRevisionCheck>
			<PanelBody className="edit-post-last-revision__panel">
				<PostLastRevision />
			</PanelBody>
		</PostLastRevisionCheck>
	);
}

export default function TemplateCard() {
	const {
		info: { title, description, icon },
		template,
	} = useSelect( ( select ) => {
		const { getEditedPostType, getEditedPostId } = select( editSiteStore );
		const { getEditedEntityRecord } = select( coreStore );
		const { __experimentalGetTemplateInfo: getTemplateInfo } =
			select( editorStore );

		const postType = getEditedPostType();
		const postId = getEditedPostId();
		const record = getEditedEntityRecord( 'postType', postType, postId );

		const info = record ? getTemplateInfo( record ) : {};

		return { info, template: record };
	}, [] );

	if ( ! title && ! description ) {
		return null;
	}

	return (
		<div className="edit-site-template-card">
			<Icon className="edit-site-template-card__icon" icon={ icon } />
			<div className="edit-site-template-card__content">
				<div className="edit-site-template-card__header">
					<h2 className="edit-site-template-card__title">
						{ decodeEntities( title ) }
					</h2>
					<TemplateActions template={ template } />
				</div>
				<div className="edit-site-template-card__description">
					{ decodeEntities( description ) }
				</div>
				<TemplateAreas />
				<LastRevision />
			</div>
		</div>
	);
}
