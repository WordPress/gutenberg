import type { Meta, StoryObj } from '@storybook/react-vite';
import * as Avatar from '../';

const meta: Meta< typeof Avatar.Root > = {
	title: 'Design System/Components/Avatar/Usage Guidelines',
	component: Avatar.Root,
	tags: [ '!dev', 'manifest' ],
	parameters: {
		controls: { disable: true },
	},
};
export default meta;

type Story = StoryObj< typeof Avatar.Root >;

const SAMPLE_IMAGE =
	'https://0.gravatar.com/avatar/33252cd1f33526af53580fcb1736172f06e6716f32afdd1be19ec3096d15dea5?size=512&d=initials';

export const RecommendedUsage: Story = {
	render: () => (
		<Avatar.Root outlineColor="#3858e9">
			<Avatar.Image src={ SAMPLE_IMAGE } alt="Jane Doe" />
			<Avatar.Fallback>JD</Avatar.Fallback>
		</Avatar.Root>
	),
};

export const NotesByline: Story = {
	name: 'Notes byline',
	render: () => (
		<div
			style={ { display: 'flex', gap: '0.75rem', alignItems: 'center' } }
		>
			<Avatar.Root size="md" outlineColor="#46a494">
				<Avatar.Image src={ SAMPLE_IMAGE } alt="Jane Doe" />
				<Avatar.Fallback>JD</Avatar.Fallback>
			</Avatar.Root>
			<div>
				<div style={ { fontWeight: 500 } }>Jane Doe</div>
				<div style={ { color: '#707070' } }>2 hours ago</div>
			</div>
		</div>
	),
};

export const NotesIndicator: Story = {
	name: 'Notes indicator',
	render: () => (
		<div style={ { display: 'flex', alignItems: 'center' } }>
			{ [
				{ initials: 'JD', color: '#c36eff' },
				{ initials: 'AB', color: '#d94145' },
			].map( ( participant, index ) => (
				<Avatar.Root
					key={ participant.initials }
					size="sm"
					outlineColor={ participant.color }
					style={ {
						marginInlineStart: index === 0 ? 0 : '-12px',
					} }
				>
					<Avatar.Fallback>{ participant.initials }</Avatar.Fallback>
				</Avatar.Root>
			) ) }
		</div>
	),
};
