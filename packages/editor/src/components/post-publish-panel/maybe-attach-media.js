import { PanelBody, CheckboxControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { Stack } from '@wordpress/ui';
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

	// Unchecking clears the pending edit, which would otherwise take the row out
	// of the list below and leave a misclick with no way back. Ids land here the
	// first time they are unchecked and stay for the session, so the row remains
	// and simply renders unchecked.
	const [ keptVisible, setKeptVisible ] = useState( [] );

	// Kept in its own mapping, and returning a primitive: `useSelect` compares
	// mappings one level deep, so bundling this with the list below would pit a
	// number against a freshly built array and never compare equal.
	const postId = useSelect(
		( select ) => select( editorStore ).getCurrentPostId(),
		[]
	);

	const pendingMedia = useSelect(
		( select ) => {
			const { getBlocks } = select( blockEditorStore );
			const { getEntityRecord, getEntityRecordEdits } =
				select( coreStore );

			const mediaInPost = getMediaInPost( flattenBlocks( getBlocks() ) );

			const isProposed = ( attachmentId ) =>
				getEntityRecordEdits( 'postType', 'attachment', attachmentId )
					?.post === postId;

			// Read from the blocks rather than from the list of dirty records:
			// pruning to what the post actually still shows is the point, and a
			// dirty-record scan would also surface attachments edited for
			// unrelated reasons, such as a caption change.
			//
			// Resolving the record is left until after this filter, so it stays
			// a cache read for a handful of files rather than a request per
			// image in the post.
			return [ ...mediaInPost ]
				.filter(
					( attachmentId ) =>
						isProposed( attachmentId ) ||
						keptVisible.includes( attachmentId )
				)
				.map( ( attachmentId ) => ( {
					id: attachmentId,
					isProposed: isProposed( attachmentId ),
					record: getEntityRecord(
						'postType',
						'attachment',
						attachmentId
					),
				} ) );
		},
		[ postId, keptVisible ]
	);

	if ( ! pendingMedia.length ) {
		return null;
	}

	// Rows the user has unchecked stay listed but are not going to be attached,
	// so the count reflects the checked ones only.
	const proposedCount = pendingMedia.filter(
		( { isProposed } ) => isProposed
	).length;

	// The count carries the essential information while the panel is collapsed,
	// which is how it opens: with one row per file, an unbounded list would push
	// everything below it — the plugin slot included — off the panel. Naming a
	// dynamic value here follows the visibility and publish panels above.
	const panelBodyTitle = [
		__( 'Suggestion:' ),
		<span className="editor-post-publish-panel__link" key="label">
			{ proposedCount
				? sprintf(
						/* translators: %d: Number of media items that will be attached to the post. */
						_n(
							'Attach %d file',
							'Attach %d files',
							proposedCount
						),
						proposedCount
				  )
				: // Every row unchecked. The panel stays so the choice can be
				  // reversed, but a count of zero reads oddly as a suggestion.
				  __( 'Attach media' ) }
		</span>,
	];

	return (
		<PanelBody initialOpen={ false } title={ panelBodyTitle }>
			<p>
				{ __(
					'These files are not attached to any post. Attach them to record this post as where they are used.'
				) }
			</p>
			<Stack direction="column" gap="sm">
				{ pendingMedia.map( ( { id, isProposed, record } ) => {
					const thumbnailUrl =
						record?.media_details?.sizes?.thumbnail?.source_url ||
						record?.source_url;
					const title =
						decodeEntities(
							record?.title?.raw || record?.title?.rendered || ''
						) || __( 'Untitled' );

					return (
						<Stack
							key={ id }
							className="editor-post-publish-panel__attach-media-item"
							direction="row"
							gap="sm"
							align="center"
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
								checked={ isProposed }
								label={ title }
								onChange={ ( isChecked ) => {
									// Dropping the `post` key removes the edit
									// entirely, so nothing is written and the
									// record stops being dirty. Checking again
									// puts it back.
									editEntityRecord(
										'postType',
										'attachment',
										id,
										{
											post: isChecked
												? postId
												: undefined,
										},
										{ undoIgnore: true }
									);

									if ( ! isChecked ) {
										setKeptVisible( ( ids ) =>
											ids.includes( id )
												? ids
												: [ ...ids, id ]
										);
									}
								} }
							/>
						</Stack>
					);
				} ) }
			</Stack>
		</PanelBody>
	);
}
