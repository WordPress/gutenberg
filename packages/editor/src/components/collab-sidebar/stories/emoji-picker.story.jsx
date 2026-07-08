/**
 * External dependencies
 */
import { fn } from 'storybook/test';

/**
 * Internal dependencies
 */
import EmojiPicker from '../emoji-picker';

/**
 * The full searchable emoji picker used by Notes reactions in the
 * collab sidebar. It renders an 8-column grid of all Emojibase emoji
 * grouped by category, with a search field filtering on labels and
 * tags.
 *
 * The component reads its dataset from
 * `window.gutenbergEmojibaseUrl` (set by the Gutenberg plugin via an
 * inline script). In Storybook the English dataset is served from a
 * static directory mapped in `storybook/main.ts`, and the document
 * language is pinned to `en` so locale detection is deterministic.
 */
const meta = {
	title: 'Editor/EmojiPicker',
	component: EmojiPicker,
	decorators: [
		( Story ) => {
			window.gutenbergEmojibaseUrl = 'emojibase-data';
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

export const Default = {};
