import apiFetch from '@wordpress/api-fetch';
import type { Block } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import type { DataRegistry } from '@wordpress/data';

// Blocks whose contents are saved as a separate entity. The Image block
// doesn't defer crops inside these.
const SHARED_CONTENT_BLOCKS = [ 'core/block', 'core/template-part' ];

/**
 * A media edit held on a block until the post is saved. Written by the Image
 * block from the media editor's pending crop.
 */
interface PendingMediaEdit {
	sourceId: number;
	sourceUrl?: string;
	modifiers: unknown[];
	previewUrl?: string;
}

interface SavedMedia {
	id: number;
	source_url: string;
	link?: string;
	media_details?: {
		sizes?: Record< string, { source_url?: string } >;
	};
}

type Attributes = Record< string, unknown > & {
	id?: number;
	pendingMediaEdit?: PendingMediaEdit;
	sizeSlug?: string;
	linkDestination?: string;
};

// Maps a saved attachment onto each block type's attributes. This mirrors
// `getNewAttachmentImageBlockAttributes` in the Image block, which the editor
// can't import.
const ATTRIBUTES_FOR_SAVED_MEDIA: Record<
	string,
	( attributes: Attributes, media: SavedMedia ) => Attributes
> = {
	'core/image': ( attributes, media ) => {
		const next: Attributes = { id: media.id, url: media.source_url };
		const { sizeSlug, linkDestination } = attributes;
		const sizes = media.media_details?.sizes;

		if ( sizeSlug && sizeSlug !== 'full' && sizes ) {
			// WordPress doesn't generate sub-sizes larger than the file, so
			// the cropped image may not have the selected size.
			const sizeUrl = sizes[ sizeSlug ]?.source_url;
			if ( sizeUrl ) {
				next.url = sizeUrl;
			} else {
				next.sizeSlug = 'full';
			}
		}

		if ( linkDestination === 'media' ) {
			next.href = media.source_url;
		} else if ( linkDestination === 'attachment' && media.link ) {
			next.href = media.link;
		}

		return next;
	},
};

function getAttributes( block: Block ): Attributes {
	return block.attributes as Attributes;
}

/**
 * Whether the block has a pending edit for the image it shows. An edit made
 * on a different image is stale.
 *
 * @param block The block.
 */
function hasCurrentPendingEdit( block: Block ): boolean {
	const { pendingMediaEdit, id } = getAttributes( block );
	return (
		!! pendingMediaEdit &&
		pendingMediaEdit.sourceId === id &&
		!! ATTRIBUTES_FOR_SAVED_MEDIA[ block.name ]
	);
}

/**
 * Key for deduplicating edits, so blocks with the same edit to the same image
 * (e.g. a duplicated block) share one new attachment.
 *
 * @param edit The edit.
 */
function getEditKey( edit: PendingMediaEdit ): string {
	return `${ edit.sourceId }:${ JSON.stringify( edit.modifiers ) }`;
}

function collectPendingEdits(
	blocks: Block[],
	edits: Map< string, PendingMediaEdit > = new Map()
): Map< string, PendingMediaEdit > {
	for ( const block of blocks ) {
		const { pendingMediaEdit } = getAttributes( block );
		if ( pendingMediaEdit && hasCurrentPendingEdit( block ) ) {
			edits.set( getEditKey( pendingMediaEdit ), pendingMediaEdit );
		}
		if ( ! SHARED_CONTENT_BLOCKS.includes( block.name ) ) {
			collectPendingEdits( block.innerBlocks, edits );
		}
	}
	return edits;
}

/**
 * Whether any block holds a media edit waiting to be saved.
 *
 * @param blocks The post's blocks.
 */
export function hasPendingMediaEdits( blocks: Block[] ): boolean {
	return collectPendingEdits( blocks ).size > 0;
}

/**
 * Points blocks at their saved attachments and clears stale edits. Unchanged
 * subtrees are returned as-is, so an untouched tree is the same array.
 *
 * @param blocks The blocks.
 * @param saved  Saved attachments, keyed by `getEditKey`.
 */
function applySavedEdits(
	blocks: Block[],
	saved: Map< string, SavedMedia >
): Block[] {
	let hasChanged = false;
	const nextBlocks = blocks.map( ( block ) => {
		let nextBlock = block;
		const attributes = getAttributes( block );
		const { pendingMediaEdit } = attributes;

		if ( pendingMediaEdit ) {
			if ( ! hasCurrentPendingEdit( block ) ) {
				nextBlock = {
					...block,
					attributes: { ...attributes, pendingMediaEdit: undefined },
				};
			} else {
				const media = saved.get( getEditKey( pendingMediaEdit ) );
				if ( media ) {
					nextBlock = {
						...block,
						attributes: {
							...attributes,
							...ATTRIBUTES_FOR_SAVED_MEDIA[ block.name ](
								attributes,
								media
							),
							pendingMediaEdit: undefined,
						},
					};
				}
			}
		}

		if ( ! SHARED_CONTENT_BLOCKS.includes( block.name ) ) {
			const innerBlocks = applySavedEdits( block.innerBlocks, saved );
			if ( innerBlocks !== block.innerBlocks ) {
				nextBlock = { ...nextBlock, innerBlocks };
			}
		}

		if ( nextBlock !== block ) {
			hasChanged = true;
		}
		return nextBlock;
	} );
	return hasChanged ? nextBlocks : blocks;
}

/**
 * Saves one edit as a new attachment, using the same request the media editor
 * makes.
 *
 * @param registry The data registry.
 * @param edit     The edit.
 */
async function saveEdit(
	registry: DataRegistry,
	edit: PendingMediaEdit
): Promise< SavedMedia > {
	const { sourceId, sourceUrl, modifiers } = edit;
	const source = ( await registry
		.resolveSelect( coreStore )
		.getEntityRecord( 'postType', 'attachment', sourceId ) ) as
		{ source_url?: string; post?: number } | undefined;

	const media = await apiFetch< SavedMedia >( {
		path: `/wp/v2/media/${ sourceId }/edit`,
		method: 'POST',
		data: {
			src: sourceUrl ?? source?.source_url,
			modifiers,
			// `/edit` doesn't copy the parent post to the new attachment.
			...( source?.post !== undefined && { post: source.post } ),
		},
	} );

	registry
		.dispatch( coreStore )
		.receiveEntityRecords(
			'postType',
			'attachment',
			media,
			undefined,
			true
		);

	return media;
}

/**
 * Saves the media edits held on a post's blocks.
 *
 * Each distinct edit is saved once. Edits that succeed are applied even if
 * others fail, so a retry only repeats the failures. `applyTo` takes the
 * blocks as they are once the requests finish, so edits made in the meantime
 * are kept.
 *
 * @param registry The data registry.
 * @param blocks   The post's blocks.
 * @return `applyTo`, which points blocks at the new attachments, and the
 *         first failure, if any.
 */
export default async function commitPendingMediaEdits(
	registry: DataRegistry,
	blocks: Block[]
): Promise< {
	applyTo: ( currentBlocks: Block[] ) => Block[];
	error?: unknown;
} > {
	const edits = collectPendingEdits( blocks );
	const saved = new Map< string, SavedMedia >();

	const results = await Promise.allSettled(
		[ ...edits ].map( async ( [ key, edit ] ) => {
			saved.set( key, await saveEdit( registry, edit ) );
		} )
	);
	const failure = results.find(
		( result ): result is PromiseRejectedResult =>
			result.status === 'rejected'
	);

	return {
		applyTo: ( currentBlocks ) => applySavedEdits( currentBlocks, saved ),
		error: failure?.reason,
	};
}
