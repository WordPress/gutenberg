import { PanelBody, CheckboxControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { Stack } from '@wordpress/ui';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import getMediaIdsInBlocks from '../../utils/media-ids-in-blocks';

const EMPTY_ARRAY = [];

/**
 * Lists the media this post uses that belongs to no post yet, and offers to
 * record this post as its home.
 *
 * Sits beside `MaybeUploadMedia`, and works the same way: the list is *derived*
 * from the post's blocks every time the panel opens, never tracked as the user
 * edits. That is what makes it survive a reload — a draft picked up tomorrow
 * still shows what it showed today — and it also catches media that was already
 * in the post rather than only what was chosen this session.
 *
 * What the user unchecks is component state, like every other choice made in
 * this panel. Only the settled list goes to the editor store, and only because
 * this panel is unmounted the instant Publish is pressed — `savePost` is what
 * does the write. Entity edits would put the same choice in the multi-entity
 * save dialog as well, where unchecking means something subtly different;
 * offering it twice, with two meanings, is how this went wrong before. On an
 * already-published post there is no pre-publish panel, and entity edits *are*
 * the right carrier: see `useMarkMediaForAttachment`.
 */
export default function MaybeAttachMediaPanel() {
	const { setMediaToAttach } = unlock( useDispatch( editorStore ) );
	const [ excludedIds, setExcludedIds ] = useState( EMPTY_ARRAY );

	const mediaIds = useSelect(
		( select ) =>
			getMediaIdsInBlocks( select( blockEditorStore ).getBlocks() ),
		[]
	);

	// One request for the whole post: `per_page: -1` is rewritten to 100 by
	// `fetch-all-middleware`, and the resolver finishes each record's own
	// resolution, so nothing here costs a request per image.
	const media = useSelect(
		( select ) => {
			if ( ! mediaIds.length ) {
				return EMPTY_ARRAY;
			}

			return (
				select( coreStore ).getEntityRecords(
					'postType',
					'attachment',
					{
						include: mediaIds,
						per_page: -1,
					}
				) ?? EMPTY_ARRAY
			);
		},
		[ mediaIds ]
	);

	// `post` is `null` when an attachment belongs to nothing — core emits the
	// parent as `null` rather than `0` — and a number when it belongs to another
	// post, which is never taken over.
	const candidates = media.filter( ( item ) => ! item.post );

	const selectedIds = candidates
		.map( ( { id } ) => id )
		.filter( ( id ) => ! excludedIds.includes( id ) );

	// A primitive, so the effect below runs when the settled list actually
	// changes rather than on every render.
	const selectedKey = selectedIds.join();

	useEffect( () => {
		setMediaToAttach(
			selectedKey ? selectedKey.split( ',' ).map( Number ) : []
		);
	}, [ selectedKey, setMediaToAttach ] );

	if ( ! candidates.length ) {
		return null;
	}

	const panelBodyTitle = [
		__( 'Suggestion:' ),
		<span className="editor-post-publish-panel__link" key="label">
			{ selectedIds.length
				? sprintf(
						/* translators: %d: Number of media items that will be attached to the post. */
						_n(
							'Attach %d file',
							'Attach %d files',
							selectedIds.length
						),
						selectedIds.length
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
				{ candidates.map( ( item ) => {
					const thumbnailUrl =
						item.media_details?.sizes?.thumbnail?.source_url ||
						item.source_url;
					const title =
						decodeEntities(
							item.title?.raw || item.title?.rendered || ''
						) || __( 'Untitled' );

					return (
						<Stack
							key={ item.id }
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
								checked={ selectedIds.includes( item.id ) }
								label={ title }
								onChange={ ( isChecked ) =>
									setExcludedIds( ( ids ) =>
										isChecked
											? ids.filter(
													( id ) => id !== item.id
											  )
											: [ ...ids, item.id ]
									)
								}
							/>
						</Stack>
					);
				} ) }
			</Stack>
		</PanelBody>
	);
}
