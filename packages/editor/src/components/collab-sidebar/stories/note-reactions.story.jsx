/**
 * External dependencies
 */
import { fn } from 'storybook/test';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { Stack } from '@wordpress/ui';
import { dispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ReactionDisplay from '../reaction-display';
import { AddReactionButton } from '../add-reaction-picker';

/**
 * Sample reaction summary, keyed by reaction slug. Curated reactions are
 * stored under their named slug ("heart"); reactions picked from the
 * full emoji picker are stored under a hex-codepoint key ("1f338" is 🌸)
 * and have their tooltip label resolved from the Emojibase dataset.
 */
const INITIAL_REACTIONS = {
	heart: { count: 2, reacted: true },
	'1f338': { count: 1, reacted: false },
};

/**
 * The complete Notes reaction row as rendered in the collab sidebar
 * (see `note.js`): the smiley button opens the curated 5-emoji quick
 * row, whose trailing `+` option swaps in the full searchable emoji
 * picker, and existing reactions render as toggleable count pills.
 *
 * State is simulated locally so picking an emoji from either view
 * adds/toggles a pill just like it does against a real site. User-name
 * tooltips fall back to plain counts because there is no REST API in
 * Storybook.
 */
function NoteReactions( { onToggleReaction } ) {
	const [ reactions, setReactions ] = useState( INITIAL_REACTIONS );

	const toggleReaction = ( slug ) => {
		onToggleReaction?.( slug );
		setReactions( ( previous ) => {
			const entry = previous[ slug ];
			if ( entry?.reacted ) {
				const next = { ...previous };
				if ( entry.count <= 1 ) {
					delete next[ slug ];
				} else {
					next[ slug ] = {
						count: entry.count - 1,
						reacted: false,
					};
				}
				return next;
			}
			return {
				...previous,
				[ slug ]: {
					count: ( entry?.count || 0 ) + 1,
					reacted: true,
				},
			};
		} );
	};

	return (
		<Stack direction="row" gap="xs" justify="flex-start">
			<AddReactionButton
				noteId={ 1 }
				onToggleReaction={ toggleReaction }
			/>
			<ReactionDisplay
				noteId={ 1 }
				reactions={ reactions }
				onToggleReaction={ toggleReaction }
			/>
		</Stack>
	);
}

const meta = {
	title: 'Editor/Notes Reactions',
	component: ReactionDisplay,
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
		onToggleReaction: fn(),
	},
	argTypes: {
		onToggleReaction: { control: false },
	},
	render: ( args ) => <NoteReactions { ...args } />,
};
export default meta;

export const Default = {};
