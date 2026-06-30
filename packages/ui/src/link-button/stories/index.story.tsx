import { Fragment } from '@wordpress/element';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { wordpress } from '@wordpress/icons';
import { LinkButton } from '../index';

const meta: Meta< typeof LinkButton > = {
	title: 'Design System/Components/LinkButton',
	component: LinkButton,
	subcomponents: {
		'LinkButton.Icon': LinkButton.Icon,
	},
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components` and text overflow behavior. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
	},
};
export default meta;

type Story = StoryObj< typeof LinkButton >;

export const Default: Story = {
	args: {
		children: 'Link button',
		href: '#',
	},
};

export const Outline: Story = {
	...Default,
	args: {
		...Default.args,
		variant: 'outline',
	},
};

export const Minimal: Story = {
	...Default,
	args: {
		...Default.args,
		variant: 'minimal',
	},
};

export const Compact: Story = {
	...Default,
	args: {
		...Default.args,
		size: 'compact',
	},
};

export const Small: Story = {
	...Default,
	args: {
		...Default.args,
		size: 'small',
	},
};

export const Neutral: Story = {
	...Default,
	args: {
		...Default.args,
		tone: 'neutral',
	},
};

export const NeutralOutline: Story = {
	...Default,
	args: {
		...Default.args,
		tone: 'neutral',
		variant: 'outline',
	},
};

export const Unstyled: Story = {
	...Default,
	args: {
		...Default.args,
		variant: 'unstyled',
	},
};

export const AllTonesAndVariants: Story = {
	...Default,
	render: ( args ) => (
		<div
			style={ {
				display: 'grid',
				gridTemplateColumns: 'max-content max-content',
				color: 'var(--wpds-color-foreground-content-neutral)',
			} }
		>
			<div></div>
			<div style={ { textAlign: 'center' } }>Resting</div>
			{ ( [ 'brand', 'neutral' ] as const ).map( ( tone ) => (
				<Fragment key={ tone }>
					{ (
						[ 'solid', 'outline', 'minimal', 'unstyled' ] as const
					 ).map( ( variant ) => (
						<Fragment key={ variant }>
							<div
								style={ {
									paddingInlineEnd: '1rem',
									display: 'flex',
									alignItems: 'center',
								} }
							>
								{ variant }, { tone }
							</div>
							<div
								style={ {
									padding: '0.5rem 1rem',
									display: 'flex',
									alignItems: 'center',
								} }
							>
								<LinkButton
									{ ...args }
									tone={ tone }
									variant={ variant }
								/>
							</div>
						</Fragment>
					) ) }
				</Fragment>
			) ) }
		</div>
	),
};

export const WithIcon: Story = {
	...Default,
	args: {
		...Default.args,
		children: (
			<>
				<LinkButton.Icon icon={ wordpress } />
				Link button
			</>
		),
	},
};

export const OpenInNewTab: Story = {
	args: {
		children: 'Get started',
		href: 'https://make.wordpress.org/',
		openInNewTab: true,
	},
};
