/**
 * External dependencies
 */
import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * A note mention is rendered as a link to the mentioned user's author page,
 * styled as a chip rather than an underlined link. The `@` completer inserts
 * the mention carrying the user's ID in a `data-wp-note-mention-user`
 * attribute; notes saved before that switch carry a legacy `wp-note-mention`
 * class instead. The chip styles target both so existing notes keep their look.
 *
 * These stories render the note-content markup for each form inside the
 * collab-sidebar panel structure so the built editor styles apply. Both forms
 * should render as an identical chip.
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
 * Current mention markup: the user ID rides on the
 * `data-wp-note-mention-user` attribute.
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

/**
 * Legacy mention markup from notes saved before the switch to the data
 * attribute: the `wp-note-mention` class keeps the chip styling.
 */
export const LegacyClass: Story = {
	render: () => (
		<MentionChip>
			Ping{ ' ' }
			<a
				className="wp-note-mention user-5"
				href="https://example.com/author/teammate/"
			>
				@Mentionable Teammate
			</a>{ ' ' }
			please review.
		</MentionChip>
	),
};

/**
 * Both forms side by side to confirm they render as an identical chip.
 */
export const BothForms: Story = {
	render: () => (
		<div
			style={ {
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'flex-start',
				gap: '12px',
			} }
		>
			<a
				data-wp-note-mention-user="5"
				href="https://example.com/author/teammate/"
			>
				@Data attribute
			</a>
			<a
				className="wp-note-mention user-5"
				href="https://example.com/author/teammate/"
			>
				@Legacy class
			</a>
		</div>
	),
};
