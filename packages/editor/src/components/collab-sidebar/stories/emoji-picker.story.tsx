import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { dispatch } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/block-editor.
import { store as blockEditorStore } from '@wordpress/block-editor';
import EmojiPicker from '../emoji-picker';

/**
 * The full searchable emoji picker used by Notes reactions in the
 * collab sidebar. It renders an 8-column grid of all Emojibase emoji
 * grouped by category, with a search field filtering on labels and
 * tags.
 *
 * The component reads its dataset from the `noteEmojibaseUrl` block
 * editor setting (populated by the Gutenberg plugin server-side). In
 * Storybook the English dataset is served from a static directory
 * mapped in `storybook/main.ts`, and the document language is pinned
 * to `en` so locale detection is deterministic.
 */
const meta: Meta< typeof EmojiPicker > = {
	title: 'Editor/EmojiPicker',
	component: EmojiPicker,
	decorators: [
		( Story ) => {
			dispatch( blockEditorStore ).updateSettings( {
				noteEmojibaseUrl: 'emojibase-data',
			} );
			document.documentElement.lang = 'en';
			return <Story />;
		},
	],
	args: {
		onSelect: fn(),
	},
	argTypes: {
		onSelect: { control: false },
	},
};
export default meta;

export const Default: StoryObj< typeof EmojiPicker > = {};
