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
 * Emoji data is fetched from the default Emojibase CDN
 * (https://cdn.jsdelivr.net/npm/emojibase-data) on first open. For a
 * production rollout we'd point `emojibaseUrl` at a self-hosted bundle.
 *
 * @param {Object}   props          Component props.
 * @param {Function} props.onSelect Called with the selected emoji character.
 */
export default function FrimoussePicker( { onSelect } ) {
	return (
		<EmojiPicker.Root
			className="editor-collab-sidebar-panel__frimousse"
			onEmojiSelect={ ( { emoji } ) => onSelect( emoji ) }
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
