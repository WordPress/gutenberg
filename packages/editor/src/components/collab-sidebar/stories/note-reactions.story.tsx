import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from '@wordpress/element';
import { Stack } from '@wordpress/ui';
import { dispatch } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/block-editor.
import { store as blockEditorStore } from '@wordpress/block-editor';
import ReactionDisplay from '../reaction-display';
import { AddReactionButton } from '../add-reaction-picker';

/**
 * A reaction summary as the REST API returns it, keyed by reaction slug.
 */
type ReactionSummary = Record< string, { count: number; reacted: boolean } >;

/**
 * Sample summary covering both storage forms: a curated slug ("heart") and
 * a full-picker hex key ("1f338" is 🌸).
 */
const INITIAL_REACTIONS: ReactionSummary = {
	heart: { count: 2, reacted: true },
	'1f338': { count: 1, reacted: false },
};

/**
 * The Notes reaction row as rendered in the collab sidebar: an add button
 * opening the picker, plus toggleable count pills.
 *
 * State is simulated locally. Tooltips fall back to plain counts, since
 * Storybook has no REST API.
 *
 * @param props                  Component props.
 * @param props.onToggleReaction Called with the slug of the toggled reaction.
 */
function NoteReactions( {
	onToggleReaction,
}: {
	onToggleReaction?: ( slug: string ) => void;
} ) {
	const [ reactions, setReactions ] =
		useState< ReactionSummary >( INITIAL_REACTIONS );

	const toggleReaction = ( slug: string ) => {
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

const meta: Meta< typeof NoteReactions > = {
	title: 'Editor/Notes Reactions',
	component: NoteReactions,
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
};
export default meta;

export const Default: StoryObj< typeof NoteReactions > = {};
