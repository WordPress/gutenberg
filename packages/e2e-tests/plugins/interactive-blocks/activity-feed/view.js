/**
 * WordPress dependencies
 */
import {
	store,
	getContext,
	getElement,
	withSyncEvent,
	renderHTML,
} from '@wordpress/interactivity';

const { state } = store( 'test/activity-feed', {
	state: {
		// Total number of data-wp-init runs across all post cards. Lets the
		// tests assert that existing cards are NOT re-initialized by a
		// splice, and that new content initializes exactly once.
		initCount: 0,
	},
	callbacks: {
		initPost() {
			state.initCount += 1;
		},
	},
	actions: {
		// Filter tab: navigate to the target page, swapping the whole feed
		// region via the interactivity router.
		navigate: withSyncEvent( function* ( event ) {
			event.preventDefault();
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.navigate( event.target.href );
		} ),
		// Post-card like button: increments the card's own context, proving
		// the card's element identity survived the surrounding splices.
		like() {
			getContext().likes += 1;
		},
		// Load more: fetches a fragment of older posts and appends it.
		*loadMore() {
			const { ref } = getElement();
			const identity = ref.dataset.identity ?? 'data-wp-key';
			const url = new URL( ref.dataset.fragmentUrl );
			url.searchParams.set( 'identity', identity );
			const res = yield fetch( url );
			const html = yield res.json();
			const feedList = document.querySelector(
				'[data-testid="feed-list"]'
			);
			if ( feedList ) {
				renderHTML( feedList, html );
			}
		},
		// Create post: fetches a fragment for a new post (title from the
		// input) and prepends it to the feed.
		*createPost() {
			const { ref } = getElement();
			const input = document.querySelector(
				'[data-testid="new-post-title"]'
			);
			const title = input?.value ?? '';
			const identity = ref.dataset.identity ?? 'data-wp-key';
			const url = new URL( ref.dataset.fragmentUrl );
			url.searchParams.set( 'title', title );
			url.searchParams.set( 'identity', identity );
			const res = yield fetch( url );
			const html = yield res.json();
			const feedList = document.querySelector(
				'[data-testid="feed-list"]'
			);
			if ( feedList ) {
				renderHTML( feedList, html, { mode: 'prepend' } );
			}
		},
		// Add comment: fetches a fragment for a new comment and splices it
		// INTO the card that owns the button — a splice below a keyed
		// item. The card's identity (like state, context) must survive.
		*addComment() {
			const { ref } = getElement();
			const { id } = getContext();
			const identity = ref.dataset.identity ?? 'data-wp-key';
			const url = new URL( ref.dataset.fragmentUrl );
			url.searchParams.set( 'identity', identity );
			url.searchParams.set( 'postId', id );
			const res = yield fetch( url );
			const html = yield res.json();
			const comments = document.querySelector(
				`[data-testid="post-${ id }-comments"]`
			);
			if ( comments ) {
				renderHTML( comments, html );
			}
		},
	},
} );
