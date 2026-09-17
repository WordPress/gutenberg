import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { wordpress } from '@wordpress/icons';
import { Icon, Stack } from '@wordpress/ui';
import ToggleControl from '..';

const meta: Meta< typeof ToggleControl > = {
	tags: [ 'manifest' ],
	title: 'Components/Selection & Input/Common/ToggleControl',
	id: 'components-togglecontrol',
	component: ToggleControl,
	argTypes: {
		checked: { control: false },
		help: { control: { type: 'text' } },
		label: { control: { type: 'text' } },
		onChange: { action: 'onChange' },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Will be superseded by `ToggleControl` in `@wordpress/ui`, but continue using for now.',
		},
	},
};
export default meta;

type Story = StoryObj< typeof ToggleControl >;

function ControlledToggleControl( {
	onChange,
	...props
}: React.ComponentProps< typeof ToggleControl > ) {
	const [ checked, setChecked ] = useState( true );
	return (
		<ToggleControl
			{ ...props }
			checked={ checked }
			onChange={ ( ...changeArgs ) => {
				setChecked( ...changeArgs );
				onChange( ...changeArgs );
			} }
		/>
	);
}
ControlledToggleControl.displayName = 'ToggleControl';

export const Default: Story = {
	render: ( args ) => <ControlledToggleControl { ...args } />,
	args: {
		label: 'Enable something',
	},
};

export const WithHelpText: Story = {
	...Default,
	args: {
		...Default.args,
		help: 'This is some help text.',
	},
};

/**
 * When adding a visual aid, prefer placing it at the trailing end of the row,
 * rather than placing it directly before the label, or moving the toggle to the trailing end.
 */
export const WithVisual: Story = {
	...Default,
	render: ( args ) => (
		<Stack gap="md" align="flex-start" justify="space-between">
			<Stack>
				<ControlledToggleControl { ...args } />
			</Stack>
			<Stack
				align="center"
				justify="center"
				style={ {
					backgroundColor:
						'var(--wpds-color-background-surface-neutral-weak)',
					borderRadius: 'var(--wpds-border-radius-md)',
					flexShrink: 0,
					height: 'var(--wpds-dimension-size-lg)',
					width: 'var(--wpds-dimension-size-lg)',
				} }
			>
				<Icon icon={ wordpress } />
			</Stack>
		</Stack>
	),
	args: {
		...Default.args,
		help: 'Additional context that helps users understand what this setting does and when they might want to turn it on or off.',
	},
};
