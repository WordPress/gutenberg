/**
 * External dependencies
 */
import { EmojiPicker } from 'frimousse';
import emojibaseData from 'emojibase-data/en/data.json';
import emojibaseMessages from 'emojibase-data/en/messages.json';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Frimousse-based full emoji picker, styled with WPDS tokens.
 *
 * Frimousse normally fetches Emojibase data from the jsdelivr CDN. We
 * cannot ship a CDN dependency in WordPress Core, so we bundle the
 * `emojibase-data/en/{data,messages}.json` files via esbuild and serve
 * them in-process by intercepting the picker's two known fetch URLs.
 *
 * The picker is loaded lazily by reaction-emoji-picker.js, so the
 * additional bundle (~100KB gzipped for the JSON + the picker code)
 * is only paid once a user opens the more-emojis popover.
 *
 * @param {Object}   props          Component props.
 * @param {Function} props.onSelect Called with the selected emoji character.
 */

// Sentinel base URL: anything that won't ever resolve to a real network
// host. The interceptor below matches on this prefix.
const EMOJIBASE_LOCAL_URL = 'https://wordpress.local/__emojibase';

let interceptorInstalled = false;

/**
 * Install a one-time `window.fetch` interceptor that returns the bundled
 * Emojibase JSON for any URL prefixed with EMOJIBASE_LOCAL_URL. All other
 * URLs pass through unchanged. Idempotent so repeat picker mounts are
 * safe.
 */
function installEmojibaseFetchInterceptor() {
	if (
		interceptorInstalled ||
		typeof window === 'undefined' ||
		typeof window.fetch !== 'function'
	) {
		return;
	}
	const originalFetch = window.fetch.bind( window );
	window.fetch = ( input, init ) => {
		const url = typeof input === 'string' ? input : input?.url ?? '';
		if ( url.startsWith( EMOJIBASE_LOCAL_URL ) ) {
			let payload;
			if ( url.endsWith( '/data.json' ) ) {
				payload = emojibaseData;
			} else if ( url.endsWith( '/messages.json' ) ) {
				payload = emojibaseMessages;
			}
			if ( payload ) {
				return Promise.resolve(
					new Response( JSON.stringify( payload ), {
						status: 200,
						headers: {
							'content-type': 'application/json',
							'cache-control': 'public, max-age=31536000',
						},
					} )
				);
			}
		}
		return originalFetch( input, init );
	};
	interceptorInstalled = true;
}

installEmojibaseFetchInterceptor();

export default function FrimoussePicker( { onSelect } ) {
	return (
		<EmojiPicker.Root
			className="editor-collab-sidebar-panel__frimousse"
			onEmojiSelect={ ( { emoji } ) => onSelect( emoji ) }
			emojibaseUrl={ EMOJIBASE_LOCAL_URL }
			columns={ 8 }
		>
			<EmojiPicker.Search
				className="editor-collab-sidebar-panel__frimousse-search"
				placeholder={ __( 'Search emoji' ) }
			/>
			<EmojiPicker.Viewport className="editor-collab-sidebar-panel__frimousse-viewport">
				<EmojiPicker.Loading className="editor-collab-sidebar-panel__frimousse-loading">
					{ __( 'Loading…' ) }
				</EmojiPicker.Loading>
				<EmojiPicker.Empty className="editor-collab-sidebar-panel__frimousse-empty">
					{ __( 'No emoji found.' ) }
				</EmojiPicker.Empty>
				<EmojiPicker.List
					className="editor-collab-sidebar-panel__frimousse-list"
					components={ {
						CategoryHeader: ( { category, ...rest } ) => (
							<div
								{ ...rest }
								className="editor-collab-sidebar-panel__frimousse-category"
							>
								{ category.label }
							</div>
						),
						Row: ( { children, ...rest } ) => (
							<div
								{ ...rest }
								className="editor-collab-sidebar-panel__frimousse-row"
							>
								{ children }
							</div>
						),
						Emoji: ( { emoji, ...rest } ) => (
							<button
								{ ...rest }
								type="button"
								className="editor-collab-sidebar-panel__frimousse-emoji"
							>
								{ emoji.emoji }
							</button>
						),
					} }
				/>
			</EmojiPicker.Viewport>
		</EmojiPicker.Root>
	);
}
