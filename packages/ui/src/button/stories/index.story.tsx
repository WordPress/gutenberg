import { Fragment, useState } from '@wordpress/element';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { cog } from '@wordpress/icons';
import { Button } from '../index';

const meta: Meta< typeof Button > = {
	title: 'Design System/Components/Button',
	component: Button,
	argTypes: {
		'aria-pressed': {
			control: { type: 'boolean' },
		},
	},
};
export default meta;

type Story = StoryObj< typeof Button >;

export const Default: Story = {
	args: {
		children: 'Button',
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

/**
 * Destructive buttons should be used for high-stakes, irreversible actions.
 */
export const Destructive: Story = {
	...Default,
	args: {
		...Default.args,
		children: 'Permanently delete',
		tone: 'destructive',
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
				gridTemplateColumns: 'max-content repeat(2, min-content)',
				color: 'var(--wpds-color-fg-content-neutral)',
			} }
		>
			<div></div>
			<div style={ { textAlign: 'center' } }>Resting</div>
			<div style={ { textAlign: 'center' } }>Disabled</div>
			{ ( [ 'brand', 'neutral', 'destructive' ] as const ).map(
				( tone ) => (
					<Fragment key={ tone }>
						{ (
							[
								'solid',
								'outline',
								'minimal',
								'unstyled',
							] as const
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
									<Button
										{ ...args }
										tone={ tone }
										variant={ variant }
									/>
								</div>
								<div
									style={ {
										padding: '0.5rem 1rem',
										display: 'flex',
										alignItems: 'center',
									} }
								>
									<Button
										{ ...args }
										tone={ tone }
										variant={ variant }
										// Disabling because this lint rule was meant for the
										// `@wordpress/components` Button, but is being applied here.
										// TODO: rework the lint rule so that it checks the package
										// where the Button comes from.
										// eslint-disable-next-line no-restricted-syntax
										disabled
									/>
								</div>
							</Fragment>
						) ) }
					</Fragment>
				)
			) }
		</div>
	),
};

export const LinkStyledAsButton: Story = {
	...Default,
	args: {
		...Default.args,
		// Link content passed through `children`
		// eslint-disable-next-line jsx-a11y/anchor-has-content
		render: <a href="https://example.com" />,
		children: 'Link',
	},
};

export const WithIcon: Story = {
	...Default,
	args: {
		...Default.args,
		children: (
			<>
				<Button.Icon icon={ cog } />
				Button
			</>
		),
	},
};

export const Loading: Story = {
	...Default,
	args: {
		...Default.args,
		loading: true,
		loadingAnnouncement: 'Saving data',
	},
};

/**
 * The pressed state is only available for buttons with `tone="neutral"` and
 * `variant="minimal"`. This represents a toggle button that is currently in an
 * active/pressed state.
 */
export const Pressed: Story = {
	...Default,
	args: {
		...Default.args,
		tone: 'neutral',
		variant: 'minimal',
	},
	render: ( args ) => {
		const [ isPressed, setIsPressed ] = useState( true );

		return (
			<Button
				{ ...args }
				aria-pressed={ isPressed }
				onClick={ () => setIsPressed( ! isPressed ) }
			>
				Button
			</Button>
		);
	},
};
