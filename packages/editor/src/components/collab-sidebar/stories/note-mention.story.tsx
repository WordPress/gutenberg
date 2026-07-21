/**
 * External dependencies
 */
import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * A note mention is rendered as a link to the mentioned user's author page,
 * styled as a chip rather than an underlined link. The `@` completer inserts
 * the mention carrying the user's ID in a `data-wp-note-mention-user`
 * attribute.
 *
 * The story renders the note-content markup inside the collab-sidebar panel
 * structure so the built editor styles apply.
 */
const meta: Meta = {
	title: 'Editor/CollabSidebar/NoteMention',
	parameters: {
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

type Story = StoryObj;

const MentionChip = ( { children }: { children: ReactNode } ) => (
	<div className="editor-collab-sidebar-panel" style={ { maxWidth: 320 } }>
		<div className="editor-collab-sidebar-panel__thread">
			<p className="editor-collab-sidebar-panel__note-content">
				{ children }
			</p>
		</div>
	</div>
);

/**
 * The user ID rides on the `data-wp-note-mention-user` attribute.
 */
export const DataAttribute: Story = {
	render: () => (
		<MentionChip>
			Ping{ ' ' }
			<a
				data-wp-note-mention-user="5"
				href="https://example.com/author/teammate/"
			>
				@Mentionable Teammate
			</a>{ ' ' }
			please review.
		</MentionChip>
	),
};
