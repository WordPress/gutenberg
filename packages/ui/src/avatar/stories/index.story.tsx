import type { Meta, StoryObj } from '@storybook/react-vite';
import * as Avatar from '../';

const meta: Meta< typeof Avatar.Root > = {
	title: 'Design System/Components/Avatar',
	component: Avatar.Root,
	tags: [ 'manifest' ],
	subcomponents: {
		'Avatar.Image': Avatar.Image,
		'Avatar.Fallback': Avatar.Fallback,
	},
	render: ( args ) => <Avatar.Root { ...args } />,
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};
export default meta;

type Story = StoryObj< typeof Avatar.Root >;

const SAMPLE_IMAGE =
	'https://0.gravatar.com/avatar/33252cd1f33526af53580fcb1736172f06e6716f32afdd1be19ec3096d15dea5?size=512&d=initials';

export const Default: Story = {
	args: {
		children: (
			<>
				<Avatar.Image src={ SAMPLE_IMAGE } alt="Jane Doe" />
				<Avatar.Fallback delay={ 600 }>JD</Avatar.Fallback>
			</>
		),
	},
};

export const FallbackOnly: Story = {
	name: 'Fallback only',
	args: {
		children: <Avatar.Fallback>JD</Avatar.Fallback>,
	},
};

export const WithOutlineColor: Story = {
	name: 'With outline color',
	args: {
		outlineColor: '#3858e9',
		children: (
			<>
				<Avatar.Image src={ SAMPLE_IMAGE } alt="Jane Doe" />
				<Avatar.Fallback>JD</Avatar.Fallback>
			</>
		),
	},
};

export const Sizes: Story = {
	render: () => (
		<div style={ { display: 'flex', gap: '1rem', alignItems: 'center' } }>
			<Avatar.Root size="sm">
				<Avatar.Image src={ SAMPLE_IMAGE } alt="Small avatar" />
				<Avatar.Fallback>SM</Avatar.Fallback>
			</Avatar.Root>
			<Avatar.Root size="md">
				<Avatar.Image src={ SAMPLE_IMAGE } alt="Medium avatar" />
				<Avatar.Fallback>MD</Avatar.Fallback>
			</Avatar.Root>
			<Avatar.Root size="lg">
				<Avatar.Image src={ SAMPLE_IMAGE } alt="Large avatar" />
				<Avatar.Fallback>LG</Avatar.Fallback>
			</Avatar.Root>
		</div>
	),
};

export const BrokenImage: Story = {
	name: 'Broken image',
	args: {
		outlineColor: '#c36eff',
		children: (
			<>
				<Avatar.Image src="https://example.com/missing.jpg" alt="" />
				<Avatar.Fallback>JD</Avatar.Fallback>
			</>
		),
	},
};

export const OverlappingGroup: Story = {
	name: 'Overlapping group',
	render: () => (
		<div style={ { display: 'flex', alignItems: 'center' } }>
			{ [
				{ name: 'Alice', color: '#c36eff' },
				{ name: 'Bob', color: '#d94145' },
				{ name: 'Charlie', color: '#e4780a' },
			].map( ( participant, index ) => (
				<Avatar.Root
					key={ participant.name }
					size="sm"
					outlineColor={ participant.color }
					style={ {
						marginInlineStart: index === 0 ? 0 : '-12px',
					} }
				>
					<Avatar.Fallback>
						{ participant.name.slice( 0, 2 ).toUpperCase() }
					</Avatar.Fallback>
				</Avatar.Root>
			) ) }
		</div>
	),
};
