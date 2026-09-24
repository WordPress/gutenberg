import { store as coreStore } from '@wordpress/core-data';
import getMediaIdsInBlocks from './media-ids-in-blocks';
import invalidateAttachmentResolutions from './invalidate-attachment-resolutions';

/**
 * Max number of images a single save will attach. Past this the post is left alone.
 *
 * 100 is the REST API's own `per_page` maximum, so looking the images up is
 * always one request, and having a cap to requests keeps the query around 2KB —
 * inside every server's URL limit. It also matches `MAX_IMAGES` in the Gallery
 * block's dynamic source, the other place the editor bounds a media query.
 *
 * This guards against an inevitable edge case of someone creating a post with
 * hundreds of unattached images. Attaching them would mean hundreds of requests
 * going out at once. And the feature is really a background convenience, it
 * should not be the reason for a save to fail.
 */
const MAX_MEDIA_TO_ATTACH = 100;

/**
 * Logs a failure rather than putting it in the message. A failed `apiFetch`
 * isn't always an `Error` — often it's a plain object — so writing it into a
 * string would print "[object Object]".
 *
 * @param {*} reason Whatever the failure carried.
 */
function warnAttachFailed( reason ) {
	// eslint-disable-next-line no-console
	console.warn( 'Could not attach media to the post.', reason );
}

/**
 * When a post is saved, attach any images in the post content that aren't already
 * attached to a post. Uploading an image into a post has always done this,
 * but selecting existing images in the block editor historically hasn't.
 * This feature closes a gap between the block editor and the classic editor.
 *
 * @param {Object}   registry    A `@wordpress/data` registry.
 * @param {Object}   post        The post that was saved.
 * @param {number}   post.id     Its ID.
 * @param {string}   post.type   Its post type.
 * @param {Object[]} post.blocks The post's own blocks — not the ones on screen.
 *                               With "Show template" on, the editor shows the
 *                               template with the post inside it, so what's on
 *                               screen also includes the template's images.
 */
export default async function attachMediaInPost( registry, post ) {
	try {
		await attach( registry, post );
	} catch ( error ) {
		// Nothing is waiting on this, so an error thrown here would go nowhere.
		// Either lookup below can reject for any of the ordinary reasons a
		// request fails, and `resolveSelect` passes a failed resolver's error on.
		warnAttachFailed( error );
	}
}

async function attach( registry, { id: postId, type: postType, blocks } ) {
	const mediaIds = getMediaIdsInBlocks( blocks );

	if ( ! mediaIds.length ) {
		return;
	}

	if ( mediaIds.length > MAX_MEDIA_TO_ATTACH ) {
		// eslint-disable-next-line no-console
		console.warn(
			`Not attaching media: the post has more than ${ MAX_MEDIA_TO_ATTACH } images.`
		);
		return;
	}

	// Templates and the like have no front end of their own, so an image can't
	// really belong to one — and `savePost` saves those too.
	const postTypeObject = await registry
		.resolveSelect( coreStore )
		.getPostType( postType );

	if ( ! postTypeObject?.viewable ) {
		return;
	}

	// `resolveSelect` waits for the data. A plain `select` would start the
	// request and return `undefined` straight away.
	const media = await registry
		.resolveSelect( coreStore )
		.getEntityRecords( 'postType', 'attachment', {
			include: mediaIds,
			per_page: MAX_MEDIA_TO_ATTACH,
		} );

	// Only fill in an empty parent. An image can only belong to one post at a time,
	// so attaching one that's already taken would quietly remove it from its post.
	const unattached = ( media ?? [] ).filter( ( item ) => ! item.post );

	if ( ! unattached.length ) {
		return;
	}

	const { saveEntityRecord } = registry.dispatch( coreStore );

	// `allSettled` so one image the user can't edit doesn't stop the others.
	const results = await Promise.allSettled(
		unattached.map( ( item ) =>
			saveEntityRecord( 'postType', 'attachment', {
				id: item.id,
				post: postId,
			} )
		)
	);

	results.forEach( ( result ) => {
		if ( result.status === 'rejected' ) {
			warnAttachFailed( result.reason );
		}
	} );

	if ( ! results.some( ( { status } ) => status === 'fulfilled' ) ) {
		return;
	}

	// Ensure the attachments cache is updated so that on save,
	// the Dynamic Gallery and Attached images category can refresh.
	invalidateAttachmentResolutions( registry );
}
