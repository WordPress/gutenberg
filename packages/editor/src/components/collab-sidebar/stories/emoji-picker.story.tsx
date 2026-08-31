import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { dispatch } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/block-editor.
import { store as blockEditorStore } from '@wordpress/block-editor';
import EmojiPicker from '../emoji-picker';

/**
 * The full searchable emoji picker used by Notes reactions: an 8-column
 * grid grouped by category, filtered by label and tag search.
 *
 * The dataset comes from the `noteEmojibaseUrl` editor setting. Storybook
 * serves the English one from a static directory mapped in
 * `storybook/main.ts`, with the document language pinned to `en`.
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
