import { store as coreStore } from '@wordpress/core-data';
import getMediaIdsInBlocks from './media-ids-in-blocks';
import invalidateAttachmentResolutions from './invalidate-attachment-resolutions';

/**
 * Most images a single save will attach. Past this the post is left alone.
 *
 * 100 is the REST API's own `per_page` maximum, so looking the images up is
 * always one request, and asking about that many keeps the query around 2KB —
 * inside every server's URL limit. It also matches `MAX_IMAGES` in the Gallery
 * block's dynamic source, the other place the editor bounds a media query.
 *
 * Somebody will eventually put a thousand images in a post. Attaching them would
 * mean a thousand requests going out at once, and this is a background
 * convenience — it shouldn't be the reason a save falls over.
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
 * When a post is saved, attaches any images in its content that aren't already
 * attached to a post. Uploading an image into a post has always done this;
 * picking one from the Media Library never has.
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
		// Either lookup below can fail on its own: someone who can't edit other
		// people's media gets a 403.
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
	// really belong to one — and `savePost` saves those too. Checked after the
	// block scan, so a post with no images costs nothing.
	const postTypeObject = await registry
		.resolveSelect( coreStore )
		.getPostType( postType );

	if ( ! postTypeObject?.viewable ) {
		return;
	}

	// `resolveSelect` waits for the data. A plain `select` would start the
	// request and return `undefined` straight away. This is one request for the
	// whole post: `fetch-all-middleware` turns `per_page: -1` into 100.
	const media = await registry
		.resolveSelect( coreStore )
		.getEntityRecords( 'postType', 'attachment', {
			include: mediaIds,
			per_page: -1,
		} );

	// Only fill in a blank parent. An image can belong to one post at a time, so
	// attaching one that's already taken would quietly remove it from the post
	// it came from. WordPress writes "not attached" as `null`, never `0`.
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
