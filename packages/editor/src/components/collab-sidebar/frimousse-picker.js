/**
 * External dependencies
 */
import { EmojiPicker } from 'frimousse';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Frimousse-based full emoji picker, styled with WPDS tokens.
 *
 * Frimousse fetches its dataset (~770KB raw, ~85KB gzipped) from
 * `${emojibaseUrl}/${locale}/{data,messages}.json`. We do not want a
 * runtime CDN dependency, so the Gutenberg plugin ships those files in
 * `build/emojibase-data/` and exposes the directory URL via PHP as
 * `window.gutenbergEmojibaseUrl`. When this picker is consumed outside
 * the plugin (e.g. an npm consumer of @wordpress/editor), the consumer
 * can set the same global to a URL of their choice — the bundle does
 * not embed the data, so a URL must be provided one way or another.
 *
 * The picker is loaded lazily by reaction-display.js, so the Frimousse
 * code itself only ships in the editor bundle when this file is
 * imported.
 *
 * @param {Object}   props          Component props.
 * @param {Function} props.onSelect Called with the selected emoji character.
 */
export default function FrimoussePicker( { onSelect } ) {
	const emojibaseUrl =
		typeof window !== 'undefined' && window.gutenbergEmojibaseUrl
			? window.gutenbergEmojibaseUrl
			: undefined;

	return (
		<EmojiPicker.Root
			className="editor-collab-sidebar-panel__frimousse"
			onEmojiSelect={ ( { emoji } ) => onSelect( emoji ) }
			emojibaseUrl={ emojibaseUrl }
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
