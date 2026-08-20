import { PanelBody, CheckboxControl, Notice } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { store as editorStore } from '../../store';

/**
 * Block attributes holding the ID of an attachment the block displays.
 *
 * Only blocks that mark media for attachment need to appear here — the map
 * exists to *prune*, so an image the user has since deleted is never offered.
 * An explicit map rather than "any numeric attribute called `id`": `core/block`,
 * `core/navigation-link` and `core/query` all carry numeric IDs that are not
 * attachments, and offering to attach one of those would be worse than missing
 * an image.
 *
 * Galleries need no entry of their own: modern galleries hold inner `core/image`
 * blocks, and only the legacy pre-v7 format stored its own array of IDs.
 */
const MEDIA_ID_ATTRIBUTES = {
	'core/image': [ 'id' ],
	'core/gallery': [ 'ids' ],
};

function flattenBlocks( blocks ) {
	const result = [];

	blocks.forEach( ( block ) => {
		result.push( block );
		result.push( ...flattenBlocks( block.innerBlocks ) );
	} );

	return result;
}

/**
 * Collects the attachment IDs the post's blocks still display.
 *
 * @param {Object[]} blocks The post's blocks, flattened.
 * @return {Set<number>} Attachment IDs in the post.
 */
function getMediaInPost( blocks ) {
	const mediaInPost = new Set();

	blocks.forEach( ( block ) => {
		MEDIA_ID_ATTRIBUTES[ block.name ]?.forEach( ( attribute ) => {
			const value = block.attributes?.[ attribute ];

			( Array.isArray( value ) ? value : [ value ] ).forEach( ( id ) => {
				if ( Number.isInteger( id ) && id > 0 ) {
					mediaInPost.add( id );
				}
			} );
		} );
	} );

	return mediaInPost;
}

/**
 * Lists the media that will be attached to this post when it is saved, and lets
 * the user drop any of it.
 *
 * The Image and Gallery blocks record a pending edit when unattached media is
 * selected into them; nothing is written until save. This is where that decision
 * becomes visible and reversible — unchecking an image discards the pending edit
 * outright, so it stops being offered and nothing is written for it.
 */
export default function MaybeAttachMediaPanel() {
	const { editEntityRecord } = useDispatch( coreStore );

	const { pendingMedia, isPostPublic } = useSelect( ( select ) => {
		const { getBlocks } = select( blockEditorStore );
		const { getCurrentPostId, getEditedPostAttribute } =
			select( editorStore );
		const { getEntityRecord, getEntityRecordEdits } = select( coreStore );

		const postId = getCurrentPostId();
		const mediaInPost = getMediaInPost( flattenBlocks( getBlocks() ) );

		return {
			// Read from the blocks rather than from the list of dirty records:
			// pruning to what the post actually still shows is the point, and a
			// dirty-record scan would also surface attachments edited for
			// unrelated reasons, such as a caption change.
			pendingMedia: [ ...mediaInPost ]
				.filter(
					( attachmentId ) =>
						getEntityRecordEdits(
							'postType',
							'attachment',
							attachmentId
						)?.post === postId
				)
				.map( ( attachmentId ) => ( {
					id: attachmentId,
					record: getEntityRecord(
						'postType',
						'attachment',
						attachmentId
					),
				} ) ),
			isPostPublic: getEditedPostAttribute( 'status' ) === 'publish',
		};
	}, [] );

	if ( ! pendingMedia.length ) {
		return null;
	}

	const panelBodyTitle = [
		__( 'Suggestion:' ),
		<span className="editor-post-publish-panel__link" key="label">
			{ __( 'Attach media' ) }
		</span>,
	];

	return (
		<PanelBody initialOpen title={ panelBodyTitle }>
			<p>
				{ sprintf(
					/* translators: %d: Number of media items that will be attached to the post. */
					_n(
						'%d media item you added is not attached to any post. Attaching it records this post as where it is used, so it is clear what the file belongs to.',
						'%d media items you added are not attached to any post. Attaching them records this post as where they are used, so it is clear what the files belong to.',
						pendingMedia.length
					),
					pendingMedia.length
				) }
			</p>
			{ ! isPostPublic && (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'This post is not published yet. Media attached to an unpublished post is hidden from visitors everywhere it appears, including in posts that are already published.'
					) }
				</Notice>
			) }
			{ pendingMedia.map( ( { id, record } ) => {
				const thumbnailUrl =
					record?.media_details?.sizes?.thumbnail?.source_url ||
					record?.source_url;
				const title =
					decodeEntities(
						record?.title?.raw || record?.title?.rendered || ''
					) || __( 'Untitled' );

				return (
					<div
						key={ id }
						style={ {
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						} }
					>
						{ thumbnailUrl && (
							<img
								src={ thumbnailUrl }
								alt=""
								width="32"
								height="32"
								style={ {
									width: '32px',
									height: '32px',
									objectFit: 'cover',
									borderRadius: '2px',
									flexShrink: 0,
								} }
							/>
						) }
						<CheckboxControl
							checked
							label={ title }
							onChange={ () =>
								// Dropping the `post` key removes the edit
								// entirely, so the record stops being dirty and
								// this row disappears. Re-selecting the image
								// records it again.
								editEntityRecord(
									'postType',
									'attachment',
									id,
									{ post: undefined },
									{ undoIgnore: true }
								)
							}
						/>
					</div>
				);
			} ) }
		</PanelBody>
	);
}
