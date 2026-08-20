import { PanelBody, CheckboxControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { store as editorStore } from '../../store';

/**
 * Block attributes holding the ID of an attachment the block displays.
 *
 * Only blocks that propose attaching media need to appear here — the map exists
 * to *prune*, so an image the user has since deleted is never offered. An
 * explicit map rather than "any numeric attribute called `id`": `core/block`,
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
 * Lists the media that will be attached to this post when it is published, and
 * lets the user drop any of it.
 *
 * Sits beside `MaybeUploadMedia`, and is the same kind of prompt: something
 * about the post's media is worth settling before it goes out, offered once, at
 * the moment it matters. Unchecking an image discards the pending edit outright,
 * so it stops being offered and nothing is written for it.
 */
export default function MaybeAttachMediaPanel() {
	const { editEntityRecord } = useDispatch( coreStore );

	const pendingMedia = useSelect( ( select ) => {
		const { getBlocks } = select( blockEditorStore );
		const { getCurrentPostId } = select( editorStore );
		const { getEntityRecord, getEntityRecordEdits } = select( coreStore );

		const postId = getCurrentPostId();
		const mediaInPost = getMediaInPost( flattenBlocks( getBlocks() ) );

		// Read from the blocks rather than from the list of dirty records:
		// pruning to what the post actually still shows is the point, and a
		// dirty-record scan would also surface attachments edited for unrelated
		// reasons, such as a caption change.
		return [ ...mediaInPost ]
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
			} ) );
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
				{ __(
					'These files are not attached to any post. Attach them to record this post as where they are used.'
				) }
			</p>
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
								width="24"
								height="24"
								style={ {
									width: '24px',
									height: '24px',
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
