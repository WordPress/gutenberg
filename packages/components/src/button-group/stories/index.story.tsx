import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { logged } from '@wordpress/deprecated';
import ButtonGroup from '..';
import Button from '../../button';

/**
 * ButtonGroup can be used to group any related buttons together.
 * To emphasize related buttons, a group should share a common container.
 *
 * This component is deprecated. Use `ToggleGroupControl` instead.
 */
const meta: Meta< typeof ButtonGroup > = {
	title: 'Components/@wordpress-components/Deprecated/ButtonGroup',
	id: 'components-buttongroup',
	component: ButtonGroup,
	argTypes: {
		children: { control: false },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
	play: () => {
		expect(
			logged[
				'wp.components.ButtonGroup is deprecated since version 6.8. Please use wp.components.__experimentalToggleGroupControl instead.'
			]
		).toBe( true );
	},
};
export default meta;

export const Default: StoryObj< typeof ButtonGroup > = {
	args: {
		children: (
			<>
				<Button __next40pxDefaultSize variant="primary">
					Button 1
				</Button>
				<Button __next40pxDefaultSize>Button 2</Button>
			</>
		),
	},
};
